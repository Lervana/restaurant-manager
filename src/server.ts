import cors from "cors";
import cluster from "cluster";
import express, { Express } from "express";
import limit from "express-rate-limit";
import { graphqlHTTP } from "express-graphql";
import { GraphQLSchema } from "graphql";
import fs from "fs";
import helmet from "helmet";
import https from "https";
import util from "util";

import { IRoute } from "./types/interfaces";
import { masterLog, allLog, log } from "./logger";
import databaseProvider from "./database";
import { METHOD } from "./types/enums";

const PUBLIC_ROUTES = "/api/public";
const PRIVATE_ROUTES = "/api/private";
const readFile = util.promisify(fs.readFile);

export default class Server {
  private readonly instance: Express;

  constructor(
    routes: IRoute[],
    schema: GraphQLSchema,
    poolSize: number,
    corsOptions: object,
    isTest: any
  ) {
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
      this.configureRoutes(routes);
      this.configureGraphQL(schema);
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

  private configureRoutes(routes: IRoute[]) {
    allLog.info("Configuring routes...");
    if (!cluster.isMaster) {
      routes.forEach(({ method, path, cbs, isPublic }: IRoute) => {
        allLog.info(`Adding route: ${`[${method}] ${path}`}`, "yellow");

        if (!path || !cbs || cbs.length === 0)
          throw new Error(
            "Route need to have defined method, path and callbacks"
          );

        const prefixedPath = `${
          isPublic ? PUBLIC_ROUTES : PRIVATE_ROUTES
        }${path}`;

        switch (method) {
          case METHOD.GET:
            this.instance.get(prefixedPath, cbs);
            break;
          case METHOD.POST:
            this.instance.post(prefixedPath, cbs);
            break;
          case METHOD.PUT:
            this.instance.put(prefixedPath, cbs);
            break;
          case METHOD.PATCH:
            this.instance.patch(prefixedPath, cbs);
            break;
          case METHOD.DELETE:
            this.instance.delete(prefixedPath, cbs);
            break;
          default:
            throw new Error("Unknown method");
        }
      });
    }

    allLog.info("Configuring routes " + "[done]".green);
  }

  private configureGraphQL = (schema: GraphQLSchema) => {
    this.instance.use(
      PRIVATE_ROUTES + "/graphql",
      graphqlHTTP({ schema: schema })
    );
  };

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
