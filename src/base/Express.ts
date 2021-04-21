import cors from "cors";
import cluster from "cluster";
import express, { Express as ExpressType, RequestHandler } from "express";
import limit from "express-rate-limit";
import helmet from "helmet";
import { Inject, Service } from "typedi";

import { firstWorkerLogg, masterLog, wrapWithInfoLogSync } from "../logger";
import { METHOD } from "../types/enums";
import { IRoute } from "../types/interfaces";
import { ServerSettings } from "../types/types";

@Service()
export default class Express {
  private readonly instance: ExpressType = express();

  constructor(
    @Inject("server-settings")
    private serverSettings: ServerSettings
  ) {
    wrapWithInfoLogSync(masterLog, "Creating express instance...", () => {
      this.instance.use(helmet());
      this.instance.use(cors(serverSettings.corsOptions));
      this.instance.disable("x-powered-by");
      this.instance.use(
        serverSettings.publicRoutesPrefix,
        limit({ windowMs: 15 * 60 * 1000, max: 250 })
      );
    });
  }

  public extendInstance(requestHandler: RequestHandler) {
    this.instance.use(requestHandler);
  }

  public extendInstanceWithPath(path: string, requestHandler: RequestHandler) {
    this.instance.use(path, requestHandler);
  }

  public addRoutes(routes: IRoute[]) {
    wrapWithInfoLogSync(firstWorkerLogg, "Configuring routes...", () => {
      if (!cluster.isMaster) {
        routes.forEach(({ method, path, cbs, isPublic }: IRoute) => {
          firstWorkerLogg.info(
            `Adding route: ${`[${method}] ${path}`}`,
            [],
            "yellow"
          );

          if (!path || !cbs || cbs.length === 0)
            throw new Error(
              "Route need to have defined method, path and callbacks"
            );

          const prefixedPath = `${
            isPublic
              ? this.serverSettings.publicRoutesPrefix
              : this.serverSettings.privateRoutesPrefix
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
    });
  }

  getInstance() {
    return this.instance;
  }
}
