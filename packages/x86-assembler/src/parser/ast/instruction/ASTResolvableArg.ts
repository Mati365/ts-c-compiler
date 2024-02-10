/**
 * Resolves label address by name
 *
 * @see
 *  name might be also local name!
 */
export type ASTLabelAddrResolver = (name: string) => number;

/**
 * Lazy instruction arg, used for
 * label resolving in more advanced arguments
 * such as mem address calculation, in simpler
 * instructions it is not needed
 */
export class ASTResolvableArg<T> {
  constructor(
    protected value: T,
    protected resolved = true,
  ) {}

  get val() {
    return this.value;
  }

  toString(): string {
    const { value } = this;

    if (typeof value === 'number' && Number.isInteger(value)) {
      return `${value < 0 ? '-' : ''}0x${Math.abs(value).toString(16)}`;
    }

    return value.toString();
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  /**
   * Called when compiler tries to resolve label
   */
  tryResolve(labelResolver?: ASTLabelAddrResolver): boolean {
    this.resolved = true;
    return true;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */

  /**
   * Returns resolved flag
   */
  isResolved() {
    return this.resolved;
  }
}
