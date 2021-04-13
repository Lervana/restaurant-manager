import { RequestHandler } from "express";

import { IRoute } from "../types/interfaces";
import { METHOD } from "../types/enums";
import { getStatus } from "./status";

const routes: IRoute[] = [
  {
    method: METHOD.GET,
    path: "/status",
    cbs: [getStatus],
  },
];

export default routes;
