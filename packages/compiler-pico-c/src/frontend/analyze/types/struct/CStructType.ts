import * as R from 'ramda';
import * as E from 'fp-ts/Either';

import { dropNewLines, dumpCompilerAttrs } from '@ts-cc/core';
import { memoizeMethod } from '@ts-cc/core';

import { Identity } from '@ts-cc/core';
import { CCompilerArch, CStructAlign } from '#constants';
import { CType } from '../CType';
import { CNamedTypedEntry } from '../../scope/variables/CNamedTypedEntry';
import { StructFieldAligner } from './align';
import { CTypeCheckError, CTypeCheckErrorCode } from '../../errors/CTypeCheckError';

import { CStructTypeDescriptor, CStructEntry } from './constants/types';
import { isArrayLikeType } from '../CArrayType';
import { isUnionLikeType } from '../union';

export function isStructLikeType(type: CType): type is CStructType {
  return type?.isStruct();
}

/**
 * Defines C-like structure
 */
export class CStructType extends CType<CStructTypeDescriptor> {
  static ofBlank(arch: CCompilerArch, name?: string) {
    return new CStructType({
      arch,
      name,
      align: CStructAlign.PACKED,
      fields: new Map(),
    });
  }

  override isStruct() {
    return true;
  }

  get name() {
    return this.value.name;
  }

  get fields() {
    return this.value.fields;
  }

  get align() {
    return this.value.align;
  }

  get c89initializerFieldsCount() {
    return this.getFlattenFieldsTypes().length;
  }

  /**
   * Appends new struct field
   */
  ofAppendedField(
    entry: CNamedTypedEntry,
    bitset?: number,
  ): E.Either<CTypeCheckError, CStructType> {
    const alignerFn = this.getAlignerFn();

    return this.bind(value => {
      const { name } = entry;

      if (this.getField(name)) {
        return E.left(
          new CTypeCheckError(CTypeCheckErrorCode.REDEFINITION_OF_STRUCT_ENTRY, null, {
            name,
          }),
        );
      }

      const fieldsList = this.getFieldsList();
      const prevEntry = R.last(fieldsList)?.[1];
      const newEntry: [string, CStructEntry] = [
        name,
        new CStructEntry({
          ...entry.unwrap(),
          index: prevEntry
            ? prevEntry.index + prevEntry.type.c89initializerFieldsCount
            : 0,
          offset: alignerFn(this, entry.type),
          bitset,
        }),
      ];

      return E.right(
        new CStructType({
          ...value,
          fields: new Map([...fieldsList, newEntry]),
        }),
      );
    });
  }

  /**
   * Creates new struct with name
   */
  ofName(name: string): CStructType {
    return this.map(value => ({
      ...value,
      name,
    }));
  }

  /**
   * Compares struct with nested fields
   */
  override isEqual(value: Identity<CStructTypeDescriptor>): boolean {
    if (!(value instanceof CStructType) || value.align !== this.align) {
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

  /**
   * Sums all fields size, return size based on offset + size of last element
   */
  override getByteSize(): number {
    return this.getFieldsList().reduce((acc, [, entry]) => {
      const endOffset = entry.offset + entry.type.getByteSize();

      return Math.max(acc, endOffset);
    }, 0);
  }

  /**
   * Serialize whole structure to string
   */
  override getDisplayName(): string {
    const { name, align, arch } = this;
    let fields = this.getFieldsList()
      .map(([fieldName, entry]) => {
        const { type, bitset, offset } = entry.unwrap();
        const fieldAttrs = dumpCompilerAttrs({
          offset,
        });

        return `  ${fieldAttrs} ${dropNewLines(type.getDisplayName())} ${fieldName}${bitset ? `: ${bitset}` : ''};`;
      })
      .join('\n');

    if (!R.isEmpty(fields)) {
      fields = `\n${fields}\n`;
    }

    const structAttrs = dumpCompilerAttrs({
      arch,
      align,
      sizeof: this.getByteSize(),
    });

    return `${structAttrs} struct ${name || '<anonymous>'} {${fields}}`;
  }

  getAlignerFn() {
    return StructFieldAligner[this.align];
  }

  getFieldsList(): [string, CStructEntry][] {
    return [...this.fields.entries()];
  }

  getField(name: string) {
    return this.fields.get(name);
  }

  @memoizeMethod
  getFlattenFieldsTypes(): [string, CType, number][] {
    const mapStructEntryPair = (pair: [string, CType, number]) => {
      const [name, type, offset] = pair;

      if (isStructLikeType(type)) {
        return type
          .getFlattenFieldsTypes()
          .map(([structName, value, nestedOffset]) => [
            `${name}.${structName}`,
            value,
            offset + nestedOffset,
          ]);
      }

      if (isUnionLikeType(type)) {
        return type
          .getFlattenFieldsTypes()
          .map(([UnionName, value]) => [`${name}.${UnionName}`, value, offset]);
      }

      if (isArrayLikeType(type)) {
        return R.unnest(
          R.times<[string, CType]>(
            index =>
              mapStructEntryPair([
                `${name}.${index}`,
                type.baseType,
                offset + index * type.baseType.getByteSize(),
              ]),
            type.size,
          ),
        );
      }

      return [pair];
    };

    return this.getFieldsList().flatMap(([name, { type, offset }]) =>
      mapStructEntryPair([name, type, offset]),
    );
  }

  getFlattenFieldsCount() {
    return this.getFlattenFieldsTypes().length;
  }

  @memoizeMethod
  getFlattenFieldTypeByOffset(offset: number): CType {
    const fields = this.getFlattenFieldsTypes();

    for (let i = 0; i < fields.length; ++i) {
      const field = fields[i];
      const nextNextField = fields[i + 1];

      if (field[2] <= offset && (!nextNextField || nextNextField[2] > offset)) {
        return field[1];
      }
    }

    return null;
  }

  getFieldTypeByC89InitializerIndex(index: number): CType {
    return this.getFlattenFieldsTypes()[index]?.[1];
  }
}
