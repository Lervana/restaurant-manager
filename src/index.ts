//SETUP ----------------
process.env["NODE_CONFIG_DIR"] = __dirname + "/config/";
// ---------------------

import "colors";
import "reflect-metadata";
import config from "config";
import os from "os";
import { buildSchema } from "type-graphql";
import { Container } from "typedi";

import Server from "./base/Server";
import { resolvers } from "./graphQL/resolvers";
import { masterLog } from "./logger";
import { DatabaseSettings, ServerSettings } from "./types/types";
import routes from "./routes";

const PUBLIC_ROUTES = "/api/public";
const PRIVATE_ROUTES = "/api/private";
const cpuCount = os?.cpus()?.length;
const poolSize = Number(config.get("cluster_instances") || cpuCount);
masterLog.info(`CPU's found: ${cpuCount.toString().blue.bold}`);
masterLog.info(`Worker pool count: ${poolSize.toString().blue.bold}`);

const serverSettings: ServerSettings = {
  corsOptions: config.get("cors_options"),
  publicRoutesPrefix: PUBLIC_ROUTES,
  privateRoutesPrefix: PRIVATE_ROUTES,
  poolSize,
  port: config.get("port"),
  name: config.get("name"),
  keyPath: config.get("https.key"),
  certPath: config.get("https.cert"),
};

const databaseSettings: DatabaseSettings = {
  username: config.get("database.username"),
  password: config.get("database.password"),
  host: config.get("database.host"),
  database: config.get("database.database"),
  port: config.get("database.port"),
};

Container.set("server-settings", serverSettings);
Container.set("database-settings", databaseSettings);

const run = async () => {
  const schema = await buildSchema({
    resolvers,
    emitSchemaFile: true,
    container: Container,
  });
  const server = Container.get(Server);
  await server.configure(routes, schema, config.get("is_test"));
  await server.start();
};

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
