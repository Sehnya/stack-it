/**
 * Structured logger for Stack-It backend
 * 
 * Log levels controlled by LOG_LEVEL env var:
 * - error: Only errors (production default)
 * - warn: Errors and warnings
 * - info: Errors, warnings, and info (development default)
 * - debug: All logs including debug
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug'

interface LogContext {
  [key: string]: unknown
}

interface LogEntry {
  timestamp: string
  level: LogLevel
  module: string
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

const LOG_LEVELS: Record<LogLevel, number> = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
}

const isProduction = process.env.NODE_ENV === 'production'
const configuredLevel = (process.env.LOG_LEVEL as LogLevel) || (isProduction ? 'error' : 'info')

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] <= LOG_LEVELS[configuredLevel]
}

function formatLog(entry: LogEntry): string {
  if (isProduction) {
    // JSON format for production (easier to parse in log aggregators)
    return JSON.stringify(entry)
  }
  
  // Human-readable format for development
  const { timestamp, level, module, message, context, error } = entry
  const levelColors: Record<LogLevel, string> = {
    error: '\x1b[31m', // red
    warn: '\x1b[33m',  // yellow
    info: '\x1b[36m',  // cyan
    debug: '\x1b[90m', // gray
  }
  const reset = '\x1b[0m'
  const color = levelColors[level]
  
  let output = `${color}[${level.toUpperCase()}]${reset} [${module}] ${message}`
  
  if (context && Object.keys(context).length > 0) {
    output += ` ${JSON.stringify(context)}`
  }
  
  if (error) {
    output += `\n  Error: ${error.name}: ${error.message}`
    if (error.stack && !isProduction) {
      output += `\n  ${error.stack.split('\n').slice(1, 4).join('\n  ')}`
    }
  }
  
  return output
}

function createLogEntry(
  level: LogLevel,
  module: string,
  message: string,
  context?: LogContext,
  error?: Error
): LogEntry {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
  }
  
  if (context && Object.keys(context).length > 0) {
    entry.context = context
  }
  
  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      // Only include stack in non-production
      ...(isProduction ? {} : { stack: error.stack }),
    }
  }
  
  return entry
}

/**
 * Create a logger instance for a specific module
 */
export function createLogger(module: string) {
  return {
    error(message: string, context?: LogContext, error?: Error) {
      if (shouldLog('error')) {
        console.error(formatLog(createLogEntry('error', module, message, context, error)))
      }
    },
    
    warn(message: string, context?: LogContext) {
      if (shouldLog('warn')) {
        console.warn(formatLog(createLogEntry('warn', module, message, context)))
      }
    },
    
    info(message: string, context?: LogContext) {
      if (shouldLog('info')) {
        console.info(formatLog(createLogEntry('info', module, message, context)))
      }
    },
    
    debug(message: string, context?: LogContext) {
      if (shouldLog('debug')) {
        console.debug(formatLog(createLogEntry('debug', module, message, context)))
      }
    },
  }
}

// Pre-configured loggers for common modules
export const log = {
  auth: createLogger('AUTH'),
  posts: createLogger('POSTS'),
  admin: createLogger('ADMIN'),
  users: createLogger('USERS'),
  discussions: createLogger('DISCUSSIONS'),
  db: createLogger('DB'),
  server: createLogger('SERVER'),
}

export default log
