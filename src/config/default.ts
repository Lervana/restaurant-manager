const { nodeEnv } = require("./utils");
const { databaseConfig } = require("./database");

module.exports = {
  is_test: false,
  env: nodeEnv,
  name: "restaurant-manager",
  log_level: process.env.LOG_LEVEL || "ERROR",
  cluster_instances: process.env.CLUSTER_INSTANCES || null,
  port: process.env.PORT || 3000,
  database: databaseConfig,
  https: {
    key: process.env.HTTPS_KEY_PATH,
    cert: process.env.HTTPS_CERT_PATH,
  },
};
