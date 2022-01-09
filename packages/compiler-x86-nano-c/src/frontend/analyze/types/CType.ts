import {hasFlag} from '@compiler/core/utils';

import {IsPrintable} from '@compiler/core/interfaces';
import {Identity, Result, ok} from '@compiler/core/monads';
import {CCompilerArch, CTypeQualifier} from '@compiler/x86-nano-c/constants';
import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';
import {CQualBitmap} from '../constants';

import {
  bitsetToKeywords,
  parseKeywordsToBitset,
  isNamedType,
} from '../utils';

export type CTypeDescriptor = {
  arch: CCompilerArch,
  qualifiers?: number,
  registered?: boolean, // checks if type is newly created or not
};

/**
 * Abstract C type
 *
 * @export
 * @abstract
 * @class CType
 * @extends {Identity<T>}
 * @implements {IsPrintable}
 * @template T
 */
export abstract class CType<T extends CTypeDescriptor = CTypeDescriptor>
  extends Identity<T>
  implements IsPrintable {

  get arch() { return this.value.arch; }
  get qualifiers() { return this.value.qualifiers; }

  /**
   * Creates instance that has registered=true flag.
   * Registered flag indicates that type is present in registry
   *
   * @param {boolean} [registered=true]
   * @return {this}
   * @memberof CType
   */
  ofRegistered(registered: boolean = true): this {
    return this.map((value) => ({
      ...value,
      registered,
    }));
  }

  /**
   * Appends qualifiers to type
   *
   * @param {number} qualifiers
   * @return {this}
   * @memberof CType
   */
  ofQualifiers(qualifiers: number): this {
    return this.map((value) => ({
      ...value,
      qualifiers,
    }));
  }

  /**
   * Creates const version of type
   *
   * @return {this}
   * @memberof CType
   */
  ofConst(): this {
    return this.ofQualifiers(CQualBitmap.const);
  }

  /**
   * Drops specified qualifiers from type and returns new
   *
   * @param {number} qualifiers
   * @return {this}
   * @memberof CType
   */
  ofDropQualifiers(qualifiers: number): this {
    return this.map((value) => ({
      ...value,
      qualifiers: value.qualifiers & (~qualifiers),
    }));
  }

  /**
   * Drops constant qualifiers and returns new types
   *
   * @return {this}
   * @memberof CType
   */
  ofNonConstQualifiers(): this {
    return this.ofDropQualifiers(CQualBitmap.const);
  }

  isRegistered() { return this.value.registered; }
  isArray() { return false; }
  isEnum() { return false; }
  isPrimitive() { return false; }
  isStruct() { return false; }
  isUnion() { return false; }
  isFunction() { return false; }
  isScalar() { return false; }
  isPointer() { return false; }

  isStructLike() {
    return this.isEnum() || this.isStruct();
  }

  isConst() {
    return this.hasQualifierType(CQualBitmap.const);
  }

  isVolatile() {
    return !this.hasQualifierType(CQualBitmap.volatile);
  }

  toString() {
    return this.getShortestDisplayName();
  }

  getQualifiersDisplayName(): string {
    return bitsetToKeywords(CQualBitmap, this.qualifiers).join(' ');
  }

  hasQualifierType(types: number): boolean {
    return hasFlag(types, this.qualifiers);
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
   * Checks if type has name and display it if so
   *
   * @return {string}
   * @memberof CType
   */
  getShortestDisplayName(): string {
    if (isNamedType(this)) {
      let name = this.name;
      if (this.isStruct())
        name = `struct ${name}`;
      else if (this.isUnion())
        name = `union ${name}`;

      return name;
    }

    return this.getDisplayName();
  }

  /**
   * Gets size of type in bytes
   *
   * @return {number}
   * @memberof CType
   */
  getByteSize(): number {
    return null;
  }

  /**
   * Converts array of string type qualifiers into internal bitset format
   *
   * @static
   * @param {CTypeQualifier[]} qualifiers
   * @return {Result<number, CTypeCheckError>}
   * @memberof CType
   */
  static qualifiersToBitset(qualifiers: CTypeQualifier[]): Result<number, CTypeCheckError> {
    if (!qualifiers)
      return ok(0);

    return parseKeywordsToBitset(
      {
        errorCode: CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD,
        bitmap: CQualBitmap,
        keywords: qualifiers,
      },
    );
  }
}
