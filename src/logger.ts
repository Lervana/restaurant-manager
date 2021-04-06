import bunyan from "bunyan";
import PrettyStream from "bunyan-prettystream";
import cluster from "cluster";
import config from "config";

const enum LOG_LEVEL {
  TRACE = "trace",
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  FATAL = "fatal",
}

interface ISilentLog {
  level: LOG_LEVEL;
  msg: string;
}

class Logger {
  private readonly client: object;
  public silentLogs: ISilentLog[] = [];

  constructor() {
    const prettyStdOut = new PrettyStream();
    prettyStdOut.pipe(process.stdout);
    this.client = bunyan.createLogger({
      name: config.get("name"),
      streams: [
        {
          level: config.get("log_level"),
          type: "raw",
          stream: prettyStdOut,
        },
      ],
    });
  }

  private parsePrefixesSync(prefixes?: string[]) {
    if (prefixes && prefixes.length == 1 && prefixes[0] === "all")
      return "[#all]";
    let result = `[#${cluster.isMaster ? "master" : cluster.worker?.id}]`;
    if (prefixes && prefixes.length > 0)
      prefixes.forEach((prefix) => (result = result + `[${prefix}]`));
    return result;
  }

  private getColoredLogSync = (
    level: LOG_LEVEL,
    log: string,
    customColor?: string
  ) => {
    if (customColor) {
      // @ts-ignore
      return log[customColor];
    }

    switch (level) {
      case LOG_LEVEL.FATAL:
        return log.black.bgWhite;
      case LOG_LEVEL.ERROR:
        return log.red;
      case LOG_LEVEL.WARN:
        return log.magenta;
      case LOG_LEVEL.DEBUG:
      case LOG_LEVEL.TRACE:
        return log.gray;
      default:
        return log;
    }
  };

  private createLog = (
    level: LOG_LEVEL,
    message: string,
    prefixes?: string[],
    color?: string
  ) => {
    const parsedPrefixes = this.parsePrefixesSync(prefixes);
    const log = `${parsedPrefixes} ${message?.toString()}`;
    const coloredLog = this.getColoredLogSync(level, log, color);
    if (config.get("is_test")) this.silentLogs.push({ level, msg: coloredLog });
    else {
      // @ts-ignore
      this.client[level](coloredLog);
      //TODO store logs in database without colouring
    }
  };

  //Log on first worker
  private logOnFirstWorkerSync = () =>
    cluster && cluster.worker && cluster.worker.id && cluster.worker.id === 1;

  //Log on all workers
  public log = {
    trace: (message: string, prefixes?: string[], color?: string) =>
      this.createLog(LOG_LEVEL.TRACE, message, prefixes, color),
    debug: (message: string, prefixes?: string[], color?: string) =>
      this.createLog(LOG_LEVEL.DEBUG, message, prefixes, color),
    info: (message: string, prefixes?: string[], color?: string) =>
      this.createLog(LOG_LEVEL.INFO, message, prefixes, color),
    warn: (message: string, prefixes?: string[], color?: string) =>
      this.createLog(LOG_LEVEL.WARN, message, prefixes, color),
    error: (message: string, prefixes?: string[], color?: string) =>
      this.createLog(LOG_LEVEL.ERROR, message, prefixes, color),
    fatal: (message: string, prefixes?: string[], color?: string) =>
      this.createLog(LOG_LEVEL.FATAL, message, prefixes, color),
  };

  //Log only on master
  public masterLog = {
    trace: (message: string, prefixes?: string[], color?: string) =>
      cluster.isMaster && this.log.trace(message, prefixes, color),
    debug: (message: string, prefixes?: string[], color?: string) =>
      cluster.isMaster && this.log.debug(message, prefixes, color),
    info: (message: string, prefixes?: string[], color?: string) =>
      cluster.isMaster && this.log.info(message, prefixes, color),
    warn: (message: string, prefixes?: string[], color?: string) =>
      cluster.isMaster && this.log.warn(message, prefixes, color),
    error: (message: string, prefixes?: string[], color?: string) =>
      cluster.isMaster && this.log.error(message, prefixes, color),
    fatal: (message: string, prefixes?: string[], color?: string) =>
      cluster.isMaster && this.log.fatal(message, prefixes, color),
  };

  //Log for all in one
  public allLog = {
    trace: (message: string, color?: string) =>
      this.logOnFirstWorkerSync() && this.log.trace(message, ["all"], color),
    debug: (message: string, color?: string) =>
      this.logOnFirstWorkerSync() && this.log.debug(message, ["all"], color),
    info: (message: string, color?: string) =>
      this.logOnFirstWorkerSync() && this.log.info(message, ["all"], color),
    warn: (message: string, color?: string) =>
      this.logOnFirstWorkerSync() && this.log.warn(message, ["all"], color),
    error: (message: string, color?: string) =>
      this.logOnFirstWorkerSync() && this.log.error(message, ["all"], color),
    fatal: (message: string, color?: string) =>
      this.logOnFirstWorkerSync() && this.log.fatal(message, ["all"], color),
  };
}

const logger = new Logger();
export const log = logger.log;
export const masterLog = logger.masterLog;
export const allLog = logger.allLog;
