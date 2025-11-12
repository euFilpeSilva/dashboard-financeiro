import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private enabled = !!environment.enableDebug;

  debug(...args: unknown[]) {
    if (this.enabled) {
      // Use console.debug when available for better devtool grouping
      // eslint-disable-next-line no-console
      console.debug('[DEBUG]', ...args);
    }
  }

  info(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.info('[INFO]', ...args);
  }

  warn(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.warn('[WARN]', ...args);
  }

  error(...args: unknown[]) {
    // eslint-disable-next-line no-console
    console.error('[ERROR]', ...args);
  }
}
