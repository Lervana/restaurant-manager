import { RequestHandler } from "express";
import { GraphQLSchema } from "graphql";

import { METHOD } from "./enums";

export interface IRoute {
  method: METHOD;
  path: string;
  cbs: RequestHandler[];
  isPublic: boolean;
}

export interface IGraphQLConfig {
  schema: GraphQLSchema;
}
