import fs from "fs";
import cluster from "cluster";
import https from "https";
import { graphqlHTTP } from "express-graphql";
import { GraphQLSchema } from "graphql";
import { Inject, Service } from "typedi";
import util from "util";

import { log, masterLog, wrapWithInfoLogAsync } from "../logger";
import { IRoute } from "../types/interfaces";
import { ServerSettings } from "../types/types";
import Express from "./Express";
import DatabaseProvider from "./DatabaseProvider";

const readFile = util.promisify(fs.readFile);

@Service()
export default class Server {
  constructor(
    @Inject("server-settings")
    private serverSettings: ServerSettings,
    private express: Express,
    private databaseProvider: DatabaseProvider
  ) {}

  public async configure(
    routes: IRoute[],
    schema: GraphQLSchema,
    isTest: boolean
  ) {
    await wrapWithInfoLogAsync(masterLog, "Configuring server...", async () => {
      if (cluster.isMaster) {
        await wrapWithInfoLogAsync(
          masterLog,
          "Configuring master instance...",
          async () => {
            if (!isTest)
              for (
                let index = 0;
                index < this.serverSettings.poolSize;
                index += 1
              )
                cluster.fork();
          }
        );
      } else {
        await wrapWithInfoLogAsync(
          log,
          `Configuring worker ${cluster?.worker?.id} instance...`,
          async () => {
            await this.databaseProvider.connect();
            this.express.addRoutes(routes);
            this.express.extendInstanceWithPath(
              this.serverSettings.privateRoutesPrefix + "/graphql",
              graphqlHTTP({ schema })
            );
          }
        );
      }
    });
  }

  public async start() {
    if (cluster.isMaster) {
      log.info(
        `${this.serverSettings.name} API port ${
          this.serverSettings.port.toString().blue
        }`
      );
    } else {
      log.info("Starting...");
      const [key, cert] = await Promise.all([
        readFile(this.serverSettings.keyPath),
        readFile(this.serverSettings.certPath),
      ]);
      https
        .createServer({ key, cert }, this.express.getInstance())
        .listen(this.serverSettings.port, () => {
          log.info("HTTPS server UP".green);
        });
    }
  }
}
