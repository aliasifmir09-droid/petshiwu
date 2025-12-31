import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define which level to log based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define log format
const format = winston.format.combine(
  // Add timestamp
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Tell Winston that the logs must be colored
  winston.format.colorize({ all: true }),
  // Define the format of the message
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`,
      ),
    ),
  }),
];

// If in production, also log to file
if (process.env.NODE_ENV === 'production') {
  // CRITICAL FIX: Wrap file system operations in try-catch to prevent uncaught exceptions
  let logsDir: string | null = null;
  try {
    // Ensure logs directory exists
    logsDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }

    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        level: 'error',
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      })
    );

    // Combined log file (all logs)
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'combined.log'),
        format: winston.format.combine(
          winston.format.timestamp(),
          winston.format.json(),
        ),
      })
    );
  } catch (error: unknown) {
    // If we can't create logs directory or file transports, just log to console
    console.warn('⚠️  Could not create file transports, using console only:', error instanceof Error ? error.message : String(error));
  }
}

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Do not exit on handled exceptions
  exitOnError: false,
});

export default logger;

