const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const dns = require("node:dns");
const mongoose = require("mongoose");

const { ApolloServer } = require("@apollo/server");
const { expressMiddleware } = require("@as-integrations/express5");

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

dotenv.config();

// Prefer IPv4
dns.setDefaultResultOrder("ipv4first");

// Custom DNS servers if configured in .env
if (process.env.DNS_SERVERS) {
  dns.setServers(
    process.env.DNS_SERVERS.split(",").map((server) => server.trim())
  );
}

const app = express();

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    // 1. Connect MongoDB
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    // 2. Create Apollo GraphQL server
    const apolloServer = new ApolloServer({
      typeDefs,
      resolvers,
    });

    // 3. Start Apollo
    await apolloServer.start();

    // 4. GraphQL endpoint
    app.use(
      "/graphql",
      expressMiddleware(apolloServer, {
        context: async ({ req }) => {
          return {
            req,
          };
        },
      }),
    );

    // 5. Basic API test
    app.get("/", (req, res) => {
      res.json({
        message: "Hospital Appointment API is running",
      });
    });

    // 6. Start Express
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`GraphQL running on http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error("Server startup failed:");
    console.error(error);
  }
}

startServer();