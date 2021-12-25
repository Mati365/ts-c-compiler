import * as R from 'ramda';

import {dumpCompilerAttrs} from '@compiler/core/utils';

import {Identity, Result, ok, err} from '@compiler/core/monads';
import {CCompilerArch, CStructAlign} from '@compiler/x86-nano-c/constants';
import {CType} from '../CType';
import {CNamedTypedEntry} from '../parts';
import {StructFieldAligner} from './align';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {
  CStructTypeDescriptor,
  CStructEntry,
} from './constants/types';

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

  get name() { return this.value.name; }
  get fields() { return this.value.fields; }
  get align() { return this.value.align; }

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
            {
              name,
            },
          ),
        );
      }

      const newEntry: [string, CStructEntry] = [
        name,
        new CStructEntry(
          {
            ...entry.unwrap(),
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
              ...this.getFieldsList(),
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
  ofName(name: string):CStructType {
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
  isEqual(value: Identity<CStructTypeDescriptor>): boolean {
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
  getByteSize(): number {
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
  getDisplayName(): string {
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
            `  ${fieldAttrs} ${type.getDisplayName()} ${fieldName}${bitset ? `: ${bitset}` : ''};`
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
}
