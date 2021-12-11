import {Identity} from '@compiler/core/monads';

export abstract class CType<T extends {}> extends Identity<T> {
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
