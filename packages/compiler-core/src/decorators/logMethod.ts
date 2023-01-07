import * as R from 'ramda';

type LoggerCaller = (...args: any[]) => void;

/**
 * Creates logger on method
 */
export function logMethod(logger: string | LoggerCaller, afterExec: boolean) {
  const loggerFn: LoggerCaller = R.is(String, logger)
    ? () => console.info(logger)
    : <LoggerCaller>logger;

  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = function wrapped(...args: any[]): any {
      if (!afterExec) {
        loggerFn(args);
      }

      const result = originalMethod.apply(this, args);

      if (afterExec) {
        loggerFn(args, result);
      }

      return result;
    };

    // return edited descriptor as opposed to overwriting the descriptor
    return descriptor;
  };
}
