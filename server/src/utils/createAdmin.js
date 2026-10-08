const dotenv = require("dotenv");

dotenv.config();

const dns = require("node:dns");

dns.setDefaultResultOrder("ipv4first");

if (process.env.DNS_SERVERS) {
  dns.setServers(
    process.env.DNS_SERVERS.split(",").map((server) => server.trim()),
  );
}

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const Admin = require("../models/Admin");

async function createAdmin() {
  try {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    if (!process.env.MONGO_URI || !email || !password) {
      throw new Error("MONGO_URI, ADMIN_EMAIL, and ADMIN_PASSWORD must be configured");
    }
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
      throw new Error("ADMIN_PASSWORD must be between 12 and 72 characters");
    }

    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    const existingAdmin = await Admin.findOne({
      email,
    });

    if (existingAdmin) {
      console.log("Admin already exists");
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await Admin.create({
      name: "Shree Pharma and Clinic Admin",
      email,
      password: hashedPassword,
      role: "ADMIN",
    });

    console.log("Admin created successfully");

    process.exit(0);
  } catch (error) {
    console.error("Admin creation failed; check the required environment settings and database connectivity.");

    process.exit(1);
  }
}

createAdmin();
