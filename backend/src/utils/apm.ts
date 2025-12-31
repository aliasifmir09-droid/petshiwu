/**
 * APM (Application Performance Monitoring) Integration Framework
 * Supports New Relic, Datadog, and Sentry
 * 
 * This framework provides a unified interface for APM tools.
 * To enable an APM tool, set the appropriate environment variable:
 * - NEW_RELIC_LICENSE_KEY for New Relic
 * - DD_API_KEY for Datadog
 * - SENTRY_DSN for Sentry
 */

import logger from './logger';

// APM tool types
type APMTool = 'newrelic' | 'datadog' | 'sentry' | 'none';

// APM instance interface
interface APMInstance {
  startTransaction(name: string, type: string): APMTransaction | null;
  recordMetric(name: string, value: number, unit?: string): void;
  recordError(error: Error, context?: Record<string, any>): void;
  setUser(userId: string, email?: string, username?: string): void;
  addCustomAttribute(key: string, value: string | number | boolean): void;
}

// APM transaction interface
interface APMTransaction {
  end(): void;
  setStatus(status: 'success' | 'error' | 'warning'): void;
  addAttribute(key: string, value: string | number | boolean): void;
  recordError(error: Error): void;
}

// Detect which APM tool to use
const detectAPMTool = (): APMTool => {
  if (process.env.NEW_RELIC_LICENSE_KEY) {
    return 'newrelic';
  }
  if (process.env.DD_API_KEY) {
    return 'datadog';
  }
  if (process.env.SENTRY_DSN) {
    return 'sentry';
  }
  return 'none';
};

// APM instance holder
let apmInstance: APMInstance | null = null;
let currentAPMTool: APMTool = 'none';

/**
 * Initialize APM based on environment variables
 */
export const initializeAPM = async (): Promise<void> => {
  currentAPMTool = detectAPMTool();

  if (currentAPMTool === 'none') {
    logger.info('ℹ️  No APM tool configured. Performance monitoring will use built-in logging.');
    logger.info('   To enable APM, set one of: NEW_RELIC_LICENSE_KEY, DD_API_KEY, or SENTRY_DSN');
    return;
  }

  try {
    switch (currentAPMTool) {
      case 'newrelic':
        await initializeNewRelic();
        break;
      case 'datadog':
        await initializeDatadog();
        break;
      case 'sentry':
        await initializeSentry();
        break;
    }
    logger.info(`✅ APM initialized: ${currentAPMTool}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(`❌ Failed to initialize APM (${currentAPMTool}):`, errorMessage);
    logger.warn('   Continuing without APM integration');
    currentAPMTool = 'none';
  }
};

/**
 * Initialize New Relic APM
 */
const initializeNewRelic = async (): Promise<void> => {
  try {
    // Dynamic import to avoid errors if newrelic package isn't installed
    const newrelic = require('newrelic');
    
    apmInstance = {
      startTransaction: (name: string, type: string) => {
        const transaction = newrelic.startWebTransaction(name, () => {
          return {
            end: () => newrelic.endTransaction(),
            setStatus: (status: 'success' | 'error' | 'warning') => {
              if (status === 'error') {
                newrelic.recordError(new Error('Transaction error'));
              }
            },
            addAttribute: (key: string, value: string | number | boolean) => {
              newrelic.addCustomAttribute(key, value);
            },
            recordError: (error: Error) => {
              newrelic.noticeError(error);
            },
          };
        });
        return transaction;
      },
      recordMetric: (name: string, value: number, unit?: string) => {
        newrelic.recordMetric(name, value);
      },
      recordError: (error: Error, context?: Record<string, any>) => {
        newrelic.noticeError(error, context);
      },
      setUser: (userId: string, email?: string, username?: string) => {
        newrelic.setUserId(userId);
        if (email) newrelic.addCustomAttribute('user.email', email);
        if (username) newrelic.addCustomAttribute('user.username', username);
      },
      addCustomAttribute: (key: string, value: string | number | boolean) => {
        newrelic.addCustomAttribute(key, value);
      },
    };
  } catch (error: unknown) {
    throw new Error(`New Relic initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Initialize Datadog APM
 */
const initializeDatadog = async (): Promise<void> => {
  try {
    // Dynamic import to avoid errors if dd-trace package isn't installed
    const tracer = require('dd-trace');
    tracer.init({
      service: process.env.DD_SERVICE || 'pet-ecommerce-backend',
      env: process.env.NODE_ENV || 'development',
      version: process.env.DD_VERSION || '1.0.0',
    });

    apmInstance = {
      startTransaction: (name: string, type: string) => {
        const span = tracer.startSpan(name, {
          tags: {
            'resource.name': name,
            'span.type': type,
          },
        });

        return {
          end: () => span.finish(),
          setStatus: (status: 'success' | 'error' | 'warning') => {
            span.setTag('http.status_code', status === 'success' ? 200 : status === 'error' ? 500 : 400);
          },
          addAttribute: (key: string, value: string | number | boolean) => {
            span.setTag(key, value);
          },
          recordError: (error: Error) => {
            span.setTag('error', true);
            span.setTag('error.msg', error.message);
            span.setTag('error.type', error.name);
          },
        };
      },
      recordMetric: (name: string, value: number, unit?: string) => {
        tracer.dogstatsd.gauge(name, value, [`unit:${unit || 'ms'}`]);
      },
      recordError: (error: Error, context?: Record<string, any>) => {
        const span = tracer.scope().active();
        if (span) {
          span.setTag('error', true);
          span.setTag('error.msg', error.message);
          span.setTag('error.type', error.name);
          if (context) {
            Object.entries(context).forEach(([key, value]) => {
              span.setTag(key, String(value));
            });
          }
        }
      },
      setUser: (userId: string, email?: string, username?: string) => {
        const span = tracer.scope().active();
        if (span) {
          span.setTag('user.id', userId);
          if (email) span.setTag('user.email', email);
          if (username) span.setTag('user.username', username);
        }
      },
      addCustomAttribute: (key: string, value: string | number | boolean) => {
        const span = tracer.scope().active();
        if (span) {
          span.setTag(key, value);
        }
      },
    };
  } catch (error: unknown) {
    throw new Error(`Datadog initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Initialize Sentry APM
 */
const initializeSentry = async (): Promise<void> => {
  try {
    // Dynamic import to avoid errors if @sentry/node package isn't installed
    const Sentry = require('@sentry/node');
    
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: parseFloat(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.1'), // 10% of transactions
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
      ],
    });

    apmInstance = {
      startTransaction: (name: string, type: string) => {
        const transaction = Sentry.startTransaction({
          op: type,
          name: name,
        });

        return {
          end: () => transaction.finish(),
          setStatus: (status: 'success' | 'error' | 'warning') => {
            transaction.setStatus(status);
          },
          addAttribute: (key: string, value: string | number | boolean) => {
            transaction.setData(key, value);
          },
          recordError: (error: Error) => {
            Sentry.captureException(error);
          },
        };
      },
      recordMetric: (name: string, value: number, unit?: string) => {
        Sentry.metrics.distribution(name, value, {
          unit: unit || 'ms',
        });
      },
      recordError: (error: Error, context?: Record<string, any>) => {
        Sentry.captureException(error, {
          contexts: context ? { custom: context } : undefined,
        });
      },
      setUser: (userId: string, email?: string, username?: string) => {
        Sentry.setUser({
          id: userId,
          email: email,
          username: username,
        });
      },
      addCustomAttribute: (key: string, value: string | number | boolean) => {
        Sentry.setTag(key, String(value));
      },
    };
  } catch (error: unknown) {
    throw new Error(`Sentry initialization failed: ${error instanceof Error ? error.message : String(error)}`);
  }
};

/**
 * Get APM instance (returns null if not initialized)
 */
export const getAPM = (): APMInstance | null => {
  return apmInstance;
};

/**
 * Check if APM is enabled
 */
export const isAPMEnabled = (): boolean => {
  return apmInstance !== null && currentAPMTool !== 'none';
};

/**
 * Start a transaction
 */
export const startTransaction = (name: string, type: string = 'web'): APMTransaction | null => {
  if (!apmInstance) {
    return null;
  }
  return apmInstance.startTransaction(name, type);
};

/**
 * Record a metric
 */
export const recordMetric = (name: string, value: number, unit?: string): void => {
  if (!apmInstance) {
    return;
  }
  apmInstance.recordMetric(name, value, unit);
};

/**
 * Record an error
 */
export const recordError = (error: Error, context?: Record<string, any>): void => {
  if (!apmInstance) {
    logger.error('Error (APM not enabled):', error);
    return;
  }
  apmInstance.recordError(error, context);
};

/**
 * Set user context
 */
export const setUser = (userId: string, email?: string, username?: string): void => {
  if (!apmInstance) {
    return;
  }
  apmInstance.setUser(userId, email, username);
};

/**
 * Add custom attribute
 */
export const addCustomAttribute = (key: string, value: string | number | boolean): void => {
  if (!apmInstance) {
    return;
  }
  apmInstance.addCustomAttribute(key, value);
};

/**
 * Get current APM tool
 */
export const getCurrentAPMTool = (): APMTool => {
  return currentAPMTool;
};

