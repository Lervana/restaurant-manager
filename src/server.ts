import cors from "cors";
import helmet from "helmet";
import cluster from "cluster";
import express, { Express } from "express";
import limit from "express-rate-limit";
import util from "util";
import fs from "fs";
import https from "https";
// import cluster from "cluster";
// import bodyParser from "body-parser";
// import express, { Express } from "express";
//
// import * as https from "https";
// import * as fs from "fs";
// import * as util from "util";

import { masterLog, allLog, log } from "./logger";
import databaseProvider from "./database";

const PUBLIC_ROUTES = "/api/public";
const PRIVATE_ROUTES = "/api/private";
const readFile = util.promisify(fs.readFile);

export default class Server {
  private readonly instance: Express;

  constructor(poolSize: number, corsOptions: object, isTest: any) {
    masterLog.info("Creating server instance...");

    this.instance = express();
    this.instance.use(helmet());
    this.instance.use(cors(corsOptions));
    this.instance.disable("x-powered-by");
    this.instance.use(
      PUBLIC_ROUTES,
      limit({ windowMs: 15 * 60 * 1000, max: 250 })
    );

    masterLog.info("Creating server instance " + "[done]".green);

    if (cluster.isMaster) {
      masterLog.info("Configuring master instance...");
      this.configureDatabase();
      if (!isTest)
        for (let index = 0; index < poolSize; index += 1) cluster.fork();
      masterLog.info("Configuring master instance " + "[done]".green);
    } else {
      this.configureRoutes();
    }
  }

  private configureDatabase() {
    masterLog.info("Creating database connection...");
    databaseProvider.connect();

    let counter = 1;
    const databaseInterval = setInterval(function () {
      if (databaseProvider.isConnected) {
        clearInterval(databaseInterval);
        masterLog.info("Database connected".green);
      } else if (counter == 5) {
        const message = "Unable to connect to database";
        masterLog.info(message);
        clearInterval(databaseInterval);
        throw new Error(message);
      } else {
        masterLog.info(
          `Waiting for database connection [attempt ${counter} of 5`
        );
        counter++;
      }
    }, 300);
  }

  private configureRoutes() {
    allLog.info("Configuring routes...");
  }

  async start(port: any, name: any, keyPath: string, certPath: string) {
    if (cluster.isMaster) {
      log.info(`${name} API port ${port.toString().blue}`);
    } else {
      log.info("Starting...");
      const [key, cert] = await Promise.all([
        readFile(keyPath),
        readFile(certPath),
      ]);
      https.createServer({ key, cert }, this.instance).listen(port, () => {
        log.info("HTTPS server UP".green);
      });
    }
  }
}
