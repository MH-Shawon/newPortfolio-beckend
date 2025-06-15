require("dotenv").config();

const config = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  nodeEnv: process.env.NODE_ENV || "development",
};

// Validate required environment variables
if (!config.mongoUri) {
  console.error("MONGODB_URI is not defined in environment variables");
  process.exit(1);
}

module.exports = config;
