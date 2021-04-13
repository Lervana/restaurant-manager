import { RequestHandler } from "express";

import { METHOD } from "./enums";

export interface IRoute {
  method: METHOD;
  path: string;
  cbs: RequestHandler[];
}
