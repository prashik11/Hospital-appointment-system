const { verifyToken } = require("../utils/auth");

function getAuthAdmin(req) {
  const authorization = req.headers.authorization;

  if (!authorization) {
    throw new Error("Authentication required");
  }

  const parts = authorization.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    throw new Error("Invalid authorization header");
  }

  const token = parts[1];

  try {
    const decoded = verifyToken(token);

    return decoded;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

module.exports = {
  getAuthAdmin,
};
