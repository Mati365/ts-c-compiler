/**
 * Wraps class method with decorator function
 */
export function wrapMethod<T>(decorator: (fn: T) => any) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => ({
    configurable: true,
    get() {
      const method = decorator(descriptor.value.bind(this));
      Object.defineProperty(this, propertyKey, {
        value: method,
        configurable: true,
        writable: true,
      });
      return method;
    },
  });
}
