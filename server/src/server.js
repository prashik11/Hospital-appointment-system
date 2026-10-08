const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
dotenv.config();

const dns = require("node:dns");
const mongoose = require("mongoose");
const Appointment = require("./models/Appointment");
const { rateLimitMiddleware } = require("./utils/rateLimit");
const { getCookie, COOKIE_NAME } = require("./middleware/auth");
const { HOSPITAL_TIME_ZONE } = require("./utils/validation");

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

// Prefer IPv4
dns.setDefaultResultOrder("ipv4first");

// Custom DNS servers if configured in .env
if (process.env.DNS_SERVERS) {
  dns.setServers(
    process.env.DNS_SERVERS.split(",").map((server) => server.trim())
  );
}

const app = express();
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === "production";
const configuredOrigins = (process.env.CLIENT_ORIGIN || (isProduction ? "" : "http://localhost:5173"))
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const allowedOrigins = new Set(configuredOrigins.map((origin) => new URL(origin).origin));

function validateConfiguration() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI must be configured");
  if (isProduction && !process.env.CLIENT_ORIGIN) {
    throw new Error("CLIENT_ORIGIN must be configured in production");
  }
  if (isProduction && configuredOrigins.some((origin) => !origin.startsWith("https://"))) {
    throw new Error("Production CLIENT_ORIGIN values must use HTTPS");
  }
  const cookieSameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  if (!["strict", "lax", "none"].includes(cookieSameSite)) {
    throw new Error("COOKIE_SAME_SITE must be Strict, Lax, or None");
  }
  if (cookieSameSite === "none" && !isProduction) {
    throw new Error("COOKIE_SAME_SITE=None requires production HTTPS and Secure cookies");
  }
  new Intl.DateTimeFormat("en", { timeZone: HOSPITAL_TIME_ZONE });
}

async function ensureAppointmentSlotIndex() {
  const duplicates = await Appointment.aggregate([
    { $match: { status: { $in: ["PENDING", "CONFIRMED"] } } },
    {
      $group: {
        _id: { doctorId: "$doctorId", date: "$appointmentDate", time: "$preferredTime" },
        count: { $sum: 1 },
      },
    },
    { $match: { count: { $gt: 1 } } },
    { $limit: 1 },
  ]);
  if (duplicates.length) {
    throw new Error("Active duplicate appointment slots exist. Resolve them before starting the server.");
  }

  await Appointment.collection.updateMany(
    { status: { $in: ["PENDING", "CONFIRMED"] }, slotKey: { $exists: false } },
    [{
      $set: {
        slotKey: {
          $concat: [
            { $toString: "$doctorId" }, ":", "$appointmentDate", ":", "$preferredTime",
          ],
        },
      },
    }],
  );
  await Appointment.collection.updateMany(
    { status: { $nin: ["PENDING", "CONFIRMED"] }, slotKey: { $exists: true } },
    { $unset: { slotKey: "" } },
  );
  await Appointment.collection.createIndex(
    { slotKey: 1 },
    {
      name: "unique_active_appointment_slot",
      unique: true,
      partialFilterExpression: { slotKey: { $type: "string" } },
    },
  );
}

app.set("trust proxy", process.env.TRUST_PROXY === "1" ? 1 : false);
app.use((req, res, next) => {
  res.set("X-Content-Type-Options", "nosniff");
  res.set("X-Frame-Options", "DENY");
  res.set("Referrer-Policy", "no-referrer");
  res.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.set("Cache-Control", "no-store");
  res.set("Pragma", "no-cache");
  if (isProduction) res.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});
app.use(cors({
  origin(origin, callback) {
    callback(null, !origin || allowedOrigins.has(origin));
  },
  credentials: true,
}));
app.use(express.json({ limit: "16kb" }));

async function startServer() {
  validateConfiguration();
  await mongoose.connect(process.env.MONGO_URI);

  console.log("MongoDB connected");
  await ensureAppointmentSlotIndex();

  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    introspection: !isProduction,
    csrfPrevention: true,
    allowBatchedHttpRequests: false,
    formatError(formattedError) {
      const safeCodes = new Set([
        "BAD_USER_INPUT",
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "TOO_MANY_REQUESTS",
        "GRAPHQL_VALIDATION_FAILED",
      ]);
      if (safeCodes.has(formattedError.extensions?.code)) return formattedError;
      return {
        message: "Request failed",
        locations: formattedError.locations,
        path: formattedError.path,
        extensions: { code: "INTERNAL_SERVER_ERROR" },
      };
    },
  });

  await apolloServer.start();

  app.use(
    "/graphql",
    rateLimitMiddleware({ limit: 300, windowMs: 15 * 60 * 1000 }),
    (req, res, next) => {
      if (req.method === "POST" && getCookie(req, COOKIE_NAME)) {
        const origin = req.get("origin");
        if (!origin || !allowedOrigins.has(origin)) {
          return res.status(403).json({ error: "Request origin is not allowed" });
        }
      }
      return next();
    },
    expressMiddleware(apolloServer, {
      context: async ({ req, res }) => ({ req, res }),
    }),
  );

  app.get("/", (req, res) => {
    res.json({ message: "Hospital Appointment API is running" });
  });

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log("GraphQL endpoint is ready");
  });
}

startServer().catch((error) => {
  if (isProduction) {
    console.error("Server startup failed; check production configuration and database connectivity.");
  } else {
    console.error("Server startup failed:", error.message);
  }
  process.exitCode = 1;
});
