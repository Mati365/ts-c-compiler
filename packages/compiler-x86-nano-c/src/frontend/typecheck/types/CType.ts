import {Identity} from '@compiler/core/monads';

/**
 * Abstract C type
 *
 * @export
 * @abstract
 * @class CType
 * @extends {Identity<T>}
 * @template T
 */
export abstract class CType<T extends {} = any> extends Identity<T> {
  isIndexable() { return false; }
  isCallbable() { return false; }

  toString() {
    return this.getDisplayName();
  }

  /**
   * Converts whole type to string
   *
   * @abstract
   * @return {string}
   * @memberof CType
   */
  abstract getDisplayName(): string;

  /**
   * Gets size of type in bytes
   *
   * @abstract
   * @return {number}
   * @memberof CType
   */
  abstract getByteSize(): number;
}
