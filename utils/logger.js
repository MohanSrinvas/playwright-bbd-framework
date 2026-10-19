import 'dotenv/config';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import winston from 'winston';

const supportedLevels = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
const configuredLevel = (process.env.LOG_LEVEL ?? 'INFO').toUpperCase();
const levelNames = {
  debug: 'DEBUG',
  info: 'INFO',
  warn: 'WARN',
  error: 'ERROR',
};
const sensitiveKeyPattern =
  /password|token|authorization|cookie|secret|api[_-]?key|email|first[_-]?name|last[_-]?name|phone|mobile|address|postal|birth/i;
const recentLogs = [];
const maximumRecentLogs = 2000;

if (!supportedLevels.includes(configuredLevel)) {
  throw new Error(`LOG_LEVEL must be one of ${supportedLevels.join(', ')}.`);
}

const fileLogging = process.env.LOG_TO_FILE ?? 'false';

if (!['true', 'false'].includes(fileLogging)) {
  throw new Error(`LOG_TO_FILE must be either true or false. Received: ${fileLogging}`);
}

const workerId = process.env.CUCUMBER_WORKER_ID ?? 'main';
const safeWorkerId = workerId.replace(/[^a-zA-Z0-9_-]/g, '_');
const transports = [new winston.transports.Console()];

if (fileLogging === 'true') {
  const logDirectory = path.join(process.cwd(), 'artifacts', 'logs');
  mkdirSync(logDirectory, { recursive: true });
  transports.push(
    new winston.transports.File({
      filename: path.join(logDirectory, `cucumber-${safeWorkerId}-${process.pid}.log`),
    }),
  );
}

/**
 * Replace values attached to sensitive metadata keys before formatting logs.
 *
 * @param {unknown} value Metadata value to sanitize.
 * @param {string} [key] Metadata key associated with the value.
 * @returns {unknown} Safe metadata value.
 */
function sanitizeValue(value, key = '') {
  if (sensitiveKeyPattern.test(key)) {
    return '[REDACTED]';
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([childKey, childValue]) => [
        childKey,
        sanitizeValue(childValue, childKey),
      ]),
    );
  }

  if (typeof value === 'string') {
    return value
      .replace(/\bBearer\s+\S+/gi, 'Bearer [REDACTED]')
      .replace(
        /\b(password|access[_-]?token|refresh[_-]?token|authorization|cookie|secret|api[_-]?key)\s*([=:]\s*)("[^"]*"|'[^']*'|[^\s,;]+)/gi,
        '$1$2[REDACTED]',
      )
      .replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, '[REDACTED_EMAIL]');
  }

  return value;
}

const redactSensitiveData = winston.format((info) => {
  info.message = sanitizeValue(info.message);
  for (const key of Object.keys(info)) {
    if (!['level', 'message', 'timestamp'].includes(key)) {
      info[key] = sanitizeValue(info[key], key);
    }
  }
  return info;
});

const formatLogLine = winston.format.printf((info) => {
  const { timestamp, level, message, scenario, workerId: entryWorkerId, pid, ...metadata } = info;
  const context = [
    `worker:${entryWorkerId ?? workerId}`,
    `pid:${pid ?? process.pid}`,
    scenario ? `scenario:${scenario}` : undefined,
  ]
    .filter(Boolean)
    .join(' ');
  const details = Object.keys(metadata).length > 0 ? ` ${JSON.stringify(metadata)}` : '';
  const line = `${timestamp} [${levelNames[level] ?? level.toUpperCase()}] [${context}] ${message}${details}`;

  if (scenario) {
    recentLogs.push({ scenario, line });
    if (recentLogs.length > maximumRecentLogs) {
      recentLogs.shift();
    }
  }

  return line;
});

const logger = winston.createLogger({
  level: configuredLevel.toLowerCase(),
  defaultMeta: { workerId, pid: process.pid },
  format: winston.format.combine(redactSensitiveData(), winston.format.timestamp(), formatLogLine),
  transports,
});

/**
 * Return recent log lines for one scenario, suitable for a Cucumber attachment.
 *
 * @param {string} scenario Scenario name to find in the in-memory log buffer.
 * @param {number} [limit] Maximum number of lines to return.
 * @returns {string} Recent, sanitized scenario log lines.
 */
export function getScenarioLogExcerpt(scenario, limit = 100) {
  const lines = recentLogs
    .filter((entry) => entry.scenario === scenario)
    .slice(-limit)
    .map((entry) => entry.line);

  return lines.length > 0 ? lines.join('\n') : 'No scenario log entries were captured.';
}

export default logger;
