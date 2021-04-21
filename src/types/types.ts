import { CorsOptions } from "cors";

export type ServerSettings = {
  corsOptions: CorsOptions;
  publicRoutesPrefix: string;
  privateRoutesPrefix: string;
  poolSize: number;
  port: number;
  name: string;
  keyPath: string;
  certPath: string;
};

export type DatabaseSettings = {
  username: string;
  password: string;
  host: string;
  database: string;
  port: number;
};
