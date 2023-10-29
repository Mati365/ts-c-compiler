import { hasFlag } from '@ts-c/core';
import { getCompilerArchDescriptor } from 'arch';

import { IsPrintable } from '@ts-c/core';
import { Identity, Result, ok } from '@ts-c/core';
import { CCompilerArch, CTypeQualifier } from '#constants';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../errors/CTypeCheckError';
import { CQualBitmap } from '../constants';

import { bitsetToKeywords, parseKeywordsToBitset, isNamedType } from '../utils';

export type CTypeDescriptor = {
  arch: CCompilerArch;
  qualifiers?: number;
  registered?: boolean; // checks if type is newly created or not
};

/**
 * Abstract C type
 */
export abstract class CType<T extends CTypeDescriptor = CTypeDescriptor>
  extends Identity<T>
  implements IsPrintable
{
  get arch() {
    return this.value.arch;
  }

  get archDescriptor() {
    return getCompilerArchDescriptor(this.arch);
  }

  get qualifiers() {
    return this.value.qualifiers;
  }

  get scalarValuesCount() {
    return 1;
  }

  getSourceType(): CType {
    return this;
  }

  /**
   * Creates instance that has registered=true flag.
   * Registered flag indicates that type is present in registry
   */
  ofRegistered(registered: boolean = true): this {
    return this.map(value => ({
      ...value,
      registered,
    }));
  }

  /**
   * Appends qualifiers to type
   */
  ofQualifiers(qualifiers: number): this {
    return this.map(value => ({
      ...value,
      qualifiers,
    }));
  }

  /**
   * Creates const version of type
   */
  ofConst(): this {
    return this.ofQualifiers(CQualBitmap.const);
  }

  /**
   * Drops specified qualifiers from type and returns new
   */
  ofDropQualifiers(qualifiers: number): this {
    return this.map(value => ({
      ...value,
      qualifiers: value.qualifiers & ~qualifiers,
    }));
  }

  /**
   * Drops constant qualifiers and returns new types
   */
  ofNonConstQualifiers(): this {
    return this.ofDropQualifiers(CQualBitmap.const);
  }

  isRegistered() {
    return this.value.registered;
  }

  isArray() {
    return false;
  }

  isEnum() {
    return false;
  }

  isPrimitive() {
    return false;
  }

  isStruct() {
    return false;
  }

  isUnion() {
    return false;
  }

  isFunction() {
    return false;
  }

  isScalar() {
    return false;
  }

  isPointer() {
    return false;
  }

  isVoid() {
    return false;
  }

  isFlag() {
    return false;
  }

  hasInnerTypeAttributes() {
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
   */
  abstract getDisplayName(): string;

  /**
   * Checks if type has name and display it if so
   */
  getShortestDisplayName(): string {
    if (isNamedType(this)) {
      let name = this.name ?? '<anonymous>';

      if (this.isStruct()) {
        name = `struct ${name}`;
      } else if (this.isUnion()) {
        name = `union ${name}`;
      }

      return name;
    }

    return this.getDisplayName();
  }

  /**
   * Gets size of type in bytes
   */
  getByteSize(): number {
    return null;
  }

  /**
   * Checks if size matches regs like ax / bx / etc
   */
  canBeStoredInIntegralReg(): boolean {
    if (this.isFunction() || this.isVoid()) {
      return false;
    }

    const { archDescriptor } = this;
    const returnByteSize = this.getByteSize();

    return returnByteSize <= archDescriptor.regs.integral.maxRegSize;
  }

  /**
   * Checks if size matches regs like xmm0, xmm1
   */
  canBeStoredInFloatReg(): boolean {
    return false;
  }

  /**
   * Returns true if can be stored in any kind of reg
   */
  canBeStoredInReg(): boolean {
    return this.canBeStoredInFloatReg() || this.canBeStoredInIntegralReg();
  }

  /**
   * Converts array of string type qualifiers into internal bitset format
   */
  static qualifiersToBitset(
    qualifiers: CTypeQualifier[],
  ): Result<number, CTypeCheckError> {
    if (!qualifiers) {
      return ok(0);
    }

    return parseKeywordsToBitset({
      errorCode: CTypeCheckErrorCode.UNKNOWN_QUALIFIERS_KEYWORD,
      bitmap: CQualBitmap,
      keywords: qualifiers,
    });
  }
}
