import config from "config";
import mongoose from "mongoose";

class DatabaseProvider {
  private readonly connectionString: string;
  private readonly username = config.get("database.username");
  private readonly password = config.get("database.password");
  private readonly host = config.get("database.host");
  private readonly database = config.get("database.database");
  public isConnected: boolean = false;

  constructor() {
    this.connectionString = `mongodb://${this.username}:${this.password}@${this.host}/${this.database}`;
  }

  public connect = () => {
    mongoose.connect(this.connectionString, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    });

    const db = mongoose.connection;
    db.on("error", console.error.bind(console, "connection error:"));
    db.once("open", () => {
      this.isConnected = true;
    });
  };
}

const databaseProvider = new DatabaseProvider();
export default databaseProvider;
