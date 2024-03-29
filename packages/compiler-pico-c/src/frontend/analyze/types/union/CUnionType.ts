import * as R from 'ramda';
import * as E from 'fp-ts/Either';

import { dropNewLines, dumpCompilerAttrs } from '@ts-cc/core';
import { memoizeMethod } from '@ts-cc/core';

import { Identity } from '@ts-cc/core';
import { CCompilerArch } from '#constants';
import { CType } from '../CType';
import { CNamedTypedEntry } from '../../scope/variables/CNamedTypedEntry';
import { CTypeCheckError, CTypeCheckErrorCode } from '../../errors/CTypeCheckError';

import { CUnionTypeDescriptor, CUnionEntry } from './constants/types';
import { isArrayLikeType } from '../CArrayType';

import type { CStructType } from '../struct';

export function isUnionLikeType(type: CType): type is CUnionType {
  return type?.isUnion();
}

/**
 * Defines C-like Union
 *
 * @see {@link https://www.ibm.com/docs/en/zos/2.2.0?topic=initializers-initialization-structures-unions}
 */
export class CUnionType extends CType<CUnionTypeDescriptor> {
  static ofBlank(arch: CCompilerArch, name?: string) {
    return new CUnionType({
      arch,
      name,
      fields: new Map(),
    });
  }

  override isUnion() {
    return true;
  }

  get name() {
    return this.value.name;
  }

  get fields() {
    return this.value.fields;
  }

  /**
   * According to standard only first field can be initialized using c89 initializer
   */
  get c89initializerFieldsCount() {
    const [, { type }] = this.getFieldsList()[0];

    return type.c89initializerFieldsCount;
  }

  /**
   * Appends new Union field
   */
  ofAppendedField(entry: CNamedTypedEntry): E.Either<CTypeCheckError, CUnionType> {
    return this.bind(value => {
      const { name } = entry;

      if (this.getField(name)) {
        return E.left(
          new CTypeCheckError(CTypeCheckErrorCode.REDEFINITION_OF_UNION_ENTRY, null, {
            name,
          }),
        );
      }

      const fieldsList = this.getFieldsList();
      const newEntry: [string, CUnionEntry] = [name, new CUnionEntry(entry.unwrap())];

      return E.right(
        new CUnionType({
          ...value,
          fields: new Map([...fieldsList, newEntry]),
        }),
      );
    });
  }

  /**
   * Creates new Union with name
   */
  ofName(name: string): CUnionType {
    return this.map(value => ({
      ...value,
      name,
    }));
  }

  /**
   * Compares Union with nested fields
   */
  override isEqual(value: Identity<CUnionTypeDescriptor>): boolean {
    if (!(value instanceof CUnionType)) {
      return false;
    }

    const [left, right] = [this.getFieldsList(), value.getFieldsList()];

    if (left.length !== right.length) {
      return false;
    }

    return !left.some(([name, type], index) => {
      const [rightName, rightType] = right[index];
      if (!rightType) {
        return true;
      }

      return name !== rightName || type !== rightType;
    });
  }

  override getByteSize(): number {
    return this.getFieldsList().reduce(
      (acc, [, entry]) => Math.max(acc, entry.type.getByteSize()),
      0,
    );
  }

  /**
   * Serialize whole Unionure to string
   */
  override getDisplayName(): string {
    const { name, arch } = this;
    let fields = this.getFieldsList()
      .map(([fieldName, entry]) => {
        const { type } = entry.unwrap();

        return `  ${dropNewLines(type.getDisplayName())} ${fieldName};`;
      })
      .join('\n');

    if (!R.isEmpty(fields)) {
      fields = `\n${fields}\n`;
    }

    const UnionAttrs = dumpCompilerAttrs({
      arch,
      sizeof: this.getByteSize(),
    });

    return `${UnionAttrs} union ${name || '<anonymous>'} {${fields}}`;
  }

  getFieldsList(): [string, CUnionEntry][] {
    return [...this.fields.entries()];
  }

  getField(name: string) {
    return this.fields.get(name);
  }

  @memoizeMethod
  getFlattenFieldsTypes(): [string, CType][] {
    const mapUnionEntryPair = (pair: [string, CType]) => {
      const [name, type] = pair;

      if (isUnionLikeType(type)) {
        return type
          .getFlattenFieldsTypes()
          .map(([UnionName, value]) => [`${name}.${UnionName}`, value]);
      }

      if (type.isStruct()) {
        return (type as CStructType)
          .getFlattenFieldsTypes()
          .map(([UnionName, value]) => [`${name}.${UnionName}`, value]);
      }

      if (isArrayLikeType(type)) {
        return R.unnest(
          R.times<[string, CType]>(
            index => mapUnionEntryPair([`${name}.${index}`, type.baseType]),
            type.size,
          ),
        );
      }

      return [pair];
    };

    return this.getFieldsList().flatMap(([name, { type }]) =>
      mapUnionEntryPair([name, type]),
    );
  }

  getFlattenFieldsCount() {
    return this.getFlattenFieldsTypes().length;
  }

  getFieldTypeByC89InitializerIndex(index: number): CType {
    const [, { type }] = this.getFieldsList()[0];

    if (isUnionLikeType(type) || type.isStruct()) {
      return (type as any).getFieldTypeByC89InitializerIndex(index);
    }

    if (isArrayLikeType(type)) {
      return type.baseType;
    }

    return type;
  }
}
