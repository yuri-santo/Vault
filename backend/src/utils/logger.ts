import fs from 'node:fs';
import path from 'node:path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

export function createLogger(logDir: string) {
  const absDir = path.isAbsolute(logDir) ? logDir : path.join(process.cwd(), logDir);
  fs.mkdirSync(absDir, { recursive: true });

  const transport = new DailyRotateFile({
    dirname: absDir,
    filename: 'app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '10m',
    maxFiles: '14d'
  });

  return winston.createLogger({
    level: 'info',
    format: winston.format.combine(
      winston.format.timestamp(),
      winston.format.json()
    ),
    transports: [transport, new winston.transports.Console()]
  });
}
