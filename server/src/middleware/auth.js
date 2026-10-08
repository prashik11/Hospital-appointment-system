const { createHash, randomBytes } = require("node:crypto");
const Admin = require("../models/Admin");
const AdminSession = require("../models/AdminSession");
const { GraphQLError } = require("graphql");

const COOKIE_NAME = "adminSession";
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function getCookie(req, cookieName) {
  const header = req.headers.cookie || "";
  const entry = header.split(";").map((part) => part.trim())
    .find((part) => part.startsWith(`${cookieName}=`));
  if (!entry) return null;
  try {
    return decodeURIComponent(entry.slice(cookieName.length + 1));
  } catch {
    return null;
  }
}

function sessionCookieOptions() {
  const production = process.env.NODE_ENV === "production";
  const sameSite = (process.env.COOKIE_SAME_SITE || "lax").toLowerCase();
  return {
    httpOnly: true,
    secure: production,
    sameSite,
    path: "/graphql",
    maxAge: SESSION_TTL_MS,
  };
}

async function createAdminSession(admin, res) {
  const token = randomBytes(32).toString("base64url");
  await AdminSession.create({
    adminId: admin._id,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  res.cookie(COOKIE_NAME, token, sessionCookieOptions());
}

async function revokeAdminSession(req, res) {
  const token = getCookie(req, COOKIE_NAME);
  if (token) {
    await AdminSession.deleteOne({ tokenHash: hashSessionToken(token) });
  }
  const options = sessionCookieOptions();
  delete options.maxAge;
  res.clearCookie(COOKIE_NAME, options);
}

async function revokeAllAdminSessions(adminId, req, res) {
  await AdminSession.deleteMany({ adminId });
  const options = sessionCookieOptions();
  delete options.maxAge;
  res.clearCookie(COOKIE_NAME, options);
}

async function getAuthAdmin(req) {
  const token = getCookie(req, COOKIE_NAME);
  if (!token) throw new GraphQLError("Authentication required", { extensions: { code: "UNAUTHENTICATED" } });

  const session = await AdminSession.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  });
  if (!session) throw new GraphQLError("Authentication required", { extensions: { code: "UNAUTHENTICATED" } });

  const admin = await Admin.findOne({ _id: session.adminId, isActive: true })
    .select("name email role");
  if (!admin || admin.role !== "ADMIN") {
    throw new GraphQLError("Authentication required", { extensions: { code: "UNAUTHENTICATED" } });
  }

  return admin;
}

module.exports = {
  COOKIE_NAME,
  createAdminSession,
  revokeAdminSession,
  revokeAllAdminSessions,
  getAuthAdmin,
  getCookie,
};
