import mongoose from "mongoose";
import { Inject, Service } from "typedi";
import { log } from "../logger";

import { DatabaseSettings } from "../types/types";

@Service()
export default class DatabaseProvider {
  private readonly connectionString: string;

  constructor(
    @Inject("database-settings")
    { username, password, host, port, database }: DatabaseSettings
  ) {
    this.connectionString = `mongodb://${username}:${password}@${host}:${port}/${database}`;
  }

  async connect() {
    try {
      await mongoose.connect(this.connectionString, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      log.info("Database connected".green);
    } catch (error) {
      const message = "Unable to connect to database";
      log.info(message);
      throw new Error(message);
    }
  }
}
