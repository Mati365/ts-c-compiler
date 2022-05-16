import * as R from 'ramda';

import {dropNewLines, dumpCompilerAttrs} from '@compiler/core/utils';
import {memoizeMethod} from '@compiler/core/decorators';

import {Identity, Result, ok, err} from '@compiler/core/monads';
import {CCompilerArch, CStructAlign} from '@compiler/pico-c/constants';
import {CType} from '../CType';
import {CNamedTypedEntry} from '../../scope/variables/CNamedTypedEntry';
import {StructFieldAligner} from './align';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {
  CStructTypeDescriptor,
  CStructEntry,
} from './constants/types';

import {isArrayLikeType} from '../CArrayType';

export function isStructLikeType(type: CType): type is CStructType {
  return type?.isStruct();
}

/**
 * Defines C-like structure
 *
 * @export
 * @class CStructType
 * @extends {CType<CStructTypeDescriptor>}
 */
export class CStructType extends CType<CStructTypeDescriptor> {
  static ofBlank(arch: CCompilerArch, name?: string) {
    return new CStructType(
      {
        arch,
        name,
        align: CStructAlign.PACKED,
        fields: new Map,
      },
    );
  }

  override isStruct() { return true; }

  get name() { return this.value.name; }
  get fields() { return this.value.fields; }
  get align() { return this.value.align; }
  get scalarValuesCount() { return this.getFlattenFieldsTypes().length; }

  /**
   * Appends new struct field
   *
   * @param {CNamedTypedEntry} entry
   * @param {number} [bitset]
   * @return {Result<CStructType, CTypeCheckError>}
   * @memberof CStructType
   */
  ofAppendedField(
    entry: CNamedTypedEntry,
    bitset?: number,
  ): Result<CStructType, CTypeCheckError> {
    const alignerFn = this.getAlignerFn();

    return this.bind((value) => {
      const {name} = entry;

      if (this.getField(name)) {
        return err(
          new CTypeCheckError(
            CTypeCheckErrorCode.REDEFINITION_OF_STRUCT_ENTRY,
            null,
            {
              name,
            },
          ),
        );
      }

      const fieldsList = this.getFieldsList();
      const prevEntry = R.last(fieldsList)?.[1];
      const newEntry: [string, CStructEntry] = [
        name,
        new CStructEntry(
          {
            ...entry.unwrap(),
            index: (
              prevEntry
                ? prevEntry.getIndex() + prevEntry.type.scalarValuesCount
                : 0
            ),
            offset: alignerFn(this, entry.type),
            bitset,
          },
        ),
      ];

      return ok(new CStructType(
        {
          ...value,
          fields: new Map(
            [
              ...fieldsList,
              newEntry,
            ],
          ),
        },
      ));
    });
  }

  /**
   * Creates new struct with name
   *
   * @param {string} name
   * @return {CStructType}
   * @memberof CStructType
   */
  ofName(name: string): CStructType {
    return this.map((value) => ({
      ...value,
      name,
    }));
  }

  /**
   * Compares struct with nested fields
   *
   * @param {Identity<CStructTypeDescriptor>} value
   * @return {boolean}
   * @memberof CStructType
   */
  override isEqual(value: Identity<CStructTypeDescriptor>): boolean {
    if (!(value instanceof CStructType)
        || value.align !== this.align)
      return false;

    const [left, right] = [
      this.getFieldsList(),
      value.getFieldsList(),
    ];

    if (left.length !== right.length)
      return false;

    return !left.some(
      ([name, type], index) => {
        const [rightName, rightType] = right[index];
        if (!rightType)
          return true;

        return (
          name !== rightName
            || type !== rightType
        );
      },
    );
  }

  /**
   * Sums all fields size, return size based on offset + size of last element
   *
   * @return {number}
   * @memberof CStructType
   */
  override getByteSize(): number {
    return this.getFieldsList().reduce(
      (acc, [, entry]) => {
        const endOffset = entry.getOffset() + entry.type.getByteSize();

        return Math.max(acc, endOffset);
      },
      0,
    );
  }

  /**
   * Serialize whole structure to string
   *
   * @return {string}
   * @memberof CStructType
   */
  override getDisplayName(): string {
    const {name, align, arch} = this;
    let fields = (
      this
        .getFieldsList()
        .map(([fieldName, entry]) => {
          const {type, bitset, offset} = entry.unwrap();
          const fieldAttrs = dumpCompilerAttrs(
            {
              offset,
            },
          );

          return (
            `  ${fieldAttrs} ${dropNewLines(type.getDisplayName())} ${fieldName}${bitset ? `: ${bitset}` : ''};`
          );
        })
        .join('\n')
    );

    if (!R.isEmpty(fields))
      fields = `\n${fields}\n`;

    const structAttrs = dumpCompilerAttrs(
      {
        arch,
        align,
        sizeof: this.getByteSize(),
      },
    );

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
  getFlattenFieldsTypes(): [string, CType][] {
    const mapStructEntryPair = (pair: [string, CType]) => {
      const [name, type] = pair;

      if (isStructLikeType(type)) {
        return (
          type
            .getFlattenFieldsTypes()
            .map(([structName, value]) => [
              `${name}.${structName}`,
              value,
            ])
        );
      }

      if (isArrayLikeType(type)) {
        return R.unnest(
          R.times<[string, CType]>(
            (index) => mapStructEntryPair([`${name}.${index}`, type.baseType]),
            type.size,
          ),
        );
      }

      return [[name, type]];
    };

    return (
      this
        .getFieldsList()
        .flatMap(([name, {type}]) => mapStructEntryPair([name, type]))
    );
  }

  getFlattenFieldsCount() {
    return this.getFlattenFieldsTypes().length;
  }

  getFieldTypeByIndex(index: number): CType {
    return this.getFlattenFieldsTypes()[index]?.[1];
  }
}
