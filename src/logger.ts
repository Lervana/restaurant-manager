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

interface ILogger {
  trace: (message: string, prefixes?: string[], color?: string) => void;
  debug: (message: string, prefixes?: string[], color?: string) => void;
  info: (message: string, prefixes?: string[], color?: string) => void;
  warn: (message: string, prefixes?: string[], color?: string) => void;
  error: (message: string, prefixes?: string[], color?: string) => void;
  fatal: (message: string, prefixes?: string[], color?: string) => void;
}

export class Log implements ILogger {
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

  protected createLog = (
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

  public trace(message: string, prefixes?: string[], color?: string) {
    this.createLog(LOG_LEVEL.TRACE, message, prefixes, color);
  }

  public debug(message: string, prefixes?: string[], color?: string) {
    this.createLog(LOG_LEVEL.DEBUG, message, prefixes, color);
  }

  public info(message: string, prefixes?: string[], color?: string) {
    this.createLog(LOG_LEVEL.INFO, message, prefixes, color);
  }

  public warn(message: string, prefixes?: string[], color?: string) {
    this.createLog(LOG_LEVEL.WARN, message, prefixes, color);
  }

  public error(message: string, prefixes?: string[], color?: string) {
    this.createLog(LOG_LEVEL.ERROR, message, prefixes, color);
  }

  public fatal(message: string, prefixes?: string[], color?: string) {
    this.createLog(LOG_LEVEL.FATAL, message, prefixes, color);
  }
}

export class MasterLog extends Log implements ILogger {
  constructor() {
    super();
  }

  public trace(message: string, prefixes?: string[], color?: string) {
    cluster.isMaster && super.trace(message, prefixes, color);
  }

  public debug(message: string, prefixes?: string[], color?: string) {
    cluster.isMaster && super.debug(message, prefixes, color);
  }

  public info(message: string, prefixes?: string[], color?: string) {
    cluster.isMaster && super.info(message, prefixes, color);
  }

  public warn(message: string, prefixes?: string[], color?: string) {
    cluster.isMaster && super.warn(message, prefixes, color);
  }

  public error(message: string, prefixes?: string[], color?: string) {
    cluster.isMaster && super.error(message, prefixes, color);
  }

  public fatal(message: string, prefixes?: string[], color?: string) {
    cluster.isMaster && super.fatal(message, prefixes, color);
  }
}

export class FirstWorkerLog extends Log implements ILogger {
  constructor() {
    super();
  }

  private logOnFirstWorkerSync = () =>
    cluster && cluster.worker && cluster.worker.id && cluster.worker.id === 1;

  public trace(message: string, prefixes?: string[], color?: string) {
    this.logOnFirstWorkerSync() && super.trace(message, ["#1ForAll"], color);
  }

  public debug(message: string, prefixes?: string[], color?: string) {
    this.logOnFirstWorkerSync() && super.debug(message, ["#1ForAll"], color);
  }

  public info(message: string, prefixes?: string[], color?: string) {
    this.logOnFirstWorkerSync() && super.info(message, ["#1ForAll"], color);
  }

  public warn(message: string, prefixes?: string[], color?: string) {
    this.logOnFirstWorkerSync() && super.warn(message, ["#1ForAll"], color);
  }

  public error(message: string, prefixes?: string[], color?: string) {
    this.logOnFirstWorkerSync() && super.error(message, ["#1ForAll"], color);
  }

  public fatal(message: string, prefixes?: string[], color?: string) {
    this.logOnFirstWorkerSync() && super.fatal(message, ["#1ForAll"], color);
  }
}

export const log = new Log();
export const masterLog = new MasterLog();
export const firstWorkerLogg = new FirstWorkerLog();

export const wrapWithInfoLogSync = (
  logger: ILogger,
  message: string,
  action: Function
) => {
  const start = new Date().getTime();
  logger.info(message);
  action();
  logger.info(
    `${message} ` + `[done] (${new Date().getTime() - start}ms)`.green
  );
};

export const wrapWithInfoLogAsync = async (
  logger: ILogger,
  message: string,
  action: Function
) => {
  const start = new Date().getTime();
  logger.info(message);
  await action();
  logger.info(
    `${message} ` + `[done] (${new Date().getTime() - start}ms)`.green
  );
};
