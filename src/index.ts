//SETUP ----------------
process.env["NODE_CONFIG_DIR"] = __dirname + "/config/";
// ---------------------

import "colors";
import config from "config";
import os from "os";

import routes from "./routes";
import { masterLog } from "./logger";
import Server from "./server";

import "./database";

const run = async () => {
  const cpuCount = os?.cpus()?.length;
  const poolSize = Number(config.get("cluster_instances") || cpuCount);
  masterLog.info(`CPU's found: ${cpuCount.toString().blue.bold}`);
  masterLog.info(`Worker pool count: ${poolSize.toString().blue.bold}`);
  const server = new Server(
    routes,
    poolSize,
    config.get("cors_options"),
    config.get("is_test")
  );
  await server.start(
    config.get("port"),
    config.get("name"),
    config.get("https.key"),
    config.get("https.cert")
  );
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
