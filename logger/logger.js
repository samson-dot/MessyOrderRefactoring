import { createLogger, format, transports } from "winston";

const consoleFormat = format.printf(({ level, message, timestamp, ...metadata }) => {
  const metaString = Object.keys(metadata).length
    ? ` ${JSON.stringify(metadata)}`
    : "";
  return `${timestamp} [${level}]: ${message}${metaString}`;
});

export const logger = createLogger({   // ← note the `export`
  level: "info",
  format: format.combine(
    format.colorize(),
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    consoleFormat
  ),
  transports: [new transports.Console()],
});