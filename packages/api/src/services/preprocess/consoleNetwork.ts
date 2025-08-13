export interface ConsoleLog {
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  timestamp: number;
  source?: string;
}

export interface NetworkLog {
  method: string;
  url: string;
  status?: number;
  timestamp: number;
  headers?: Record<string, string>;
  responseTime?: number;
  error?: string;
}

export class LogProcessor {
  processConsoleLogs(logs: any[]): ConsoleLog[] {
    if (!Array.isArray(logs)) {
      return [];
    }

    return logs
      .filter(log => log && typeof log === 'object')
      .map(log => ({
        level: this.normalizeLogLevel(log.level),
        message: String(log.message || ''),
        timestamp: log.timestamp || Date.now(),
        source: log.source
      }))
      .filter(log => log.message.trim().length > 0);
  }

  processNetworkLogs(logs: any[]): NetworkLog[] {
    if (!Array.isArray(logs)) {
      return [];
    }

    return logs
      .filter(log => log && typeof log === 'object')
      .map(log => ({
        method: String(log.method || 'GET').toUpperCase(),
        url: String(log.url || ''),
        status: log.status ? Number(log.status) : undefined,
        timestamp: log.timestamp || Date.now(),
        headers: log.headers && typeof log.headers === 'object' ? log.headers : undefined,
        responseTime: log.responseTime ? Number(log.responseTime) : undefined,
        error: log.error ? String(log.error) : undefined
      }))
      .filter(log => log.url.trim().length > 0);
  }

  private normalizeLogLevel(level: any): ConsoleLog['level'] {
    const levelStr = String(level || 'log').toLowerCase();
    
    if (['log', 'warn', 'error', 'info', 'debug'].includes(levelStr)) {
      return levelStr as ConsoleLog['level'];
    }
    
    return 'log';
  }

  extractErrorsFromLogs(consoleLogs: ConsoleLog[]): ConsoleLog[] {
    return consoleLogs.filter(log => 
      log.level === 'error' || 
      log.message.toLowerCase().includes('error') ||
      log.message.toLowerCase().includes('failed') ||
      log.message.toLowerCase().includes('exception')
    );
  }

  extractNetworkErrors(networkLogs: NetworkLog[]): NetworkLog[] {
    return networkLogs.filter(log => 
      log.error || 
      (log.status && log.status >= 400) ||
      log.url.includes('404') ||
      log.url.includes('500')
    );
  }

  analyzeLogsForSelectorIssues(consoleLogs: ConsoleLog[]): {
    selectorErrors: ConsoleLog[];
    timeoutErrors: ConsoleLog[];
    domErrors: ConsoleLog[];
  } {
    const selectorErrors = consoleLogs.filter(log =>
      log.message.toLowerCase().includes('selector') ||
      log.message.toLowerCase().includes('element not found') ||
      log.message.toLowerCase().includes('could not find')
    );

    const timeoutErrors = consoleLogs.filter(log =>
      log.message.toLowerCase().includes('timeout') ||
      log.message.toLowerCase().includes('timed out')
    );

    const domErrors = consoleLogs.filter(log =>
      log.message.toLowerCase().includes('dom') ||
      log.message.toLowerCase().includes('node') ||
      log.message.toLowerCase().includes('element')
    );

    return {
      selectorErrors,
      timeoutErrors,
      domErrors
    };
  }

  generateLogSummary(consoleLogs: ConsoleLog[], networkLogs: NetworkLog[]): {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    networkErrors: number;
    criticalIssues: string[];
  } {
    const errorCount = consoleLogs.filter(log => log.level === 'error').length;
    const warningCount = consoleLogs.filter(log => log.level === 'warn').length;
    const networkErrors = networkLogs.filter(log => log.error || (log.status && log.status >= 400)).length;

    const criticalIssues: string[] = [];
    
    // Identify critical issues
    if (errorCount > 5) {
      criticalIssues.push(`High error count: ${errorCount} errors`);
    }
    
    if (networkErrors > 3) {
      criticalIssues.push(`Multiple network failures: ${networkErrors} requests failed`);
    }

    const selectorIssues = this.analyzeLogsForSelectorIssues(consoleLogs);
    if (selectorIssues.selectorErrors.length > 0) {
      criticalIssues.push(`Selector issues detected: ${selectorIssues.selectorErrors.length} errors`);
    }

    return {
      totalLogs: consoleLogs.length,
      errorCount,
      warningCount,
      networkErrors,
      criticalIssues
    };
  }
}
