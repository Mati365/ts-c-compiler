import * as R from 'ramda';

import {Identity} from '@compiler/core/monads';
import {CCompilerArch, CStructAlign} from '@compiler/x86-nano-c/constants';
import {CType} from '../CType';
import {CNamedTypedEntry} from '../parts';
import {StructFieldAligner} from './align';
import {
  CStructTypeDescriptor,
  CStructEntry,
} from './constants/types';

import {dumpCompilerAttrs} from '../../utils';

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
  get align() { return this.value.align; }

  /**
   * Appends new struct field
   *
   * @param {CNamedTypedEntry} entry
   * @param {number} [bitset]
   * @return {CStructType}
   * @memberof CStructType
   */
  ofAppendedField(
    entry: CNamedTypedEntry,
    bitset?: number,
  ): CStructType {
    const alignerFn = this.getAlignerFn();

    return this.map((value) => {
      const newEntry: [string, CStructEntry] = [
        entry.name,
        new CStructEntry(
          {
            ...entry.unwrap(),
            offset: alignerFn(this, entry.type),
            bitset,
          },
        ),
      ];

      return {
        ...value,
        fields: new Map(
          [
            ...this.getFieldsList(),
            newEntry,
          ],
        ),
      };
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
    const {name, align} = this;
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
        arch: this.arch,
        sizeof: this.getByteSize(),
        align,
      },
    );

    return `struct ${structAttrs} ${name || '<anonymous>'} {${fields}}`;
  }

  getAlignerFn() {
    return StructFieldAligner[this.value.align];
  }

  getFieldsList(): [string, CStructEntry][] {
    return [...this.value.fields.entries()];
  }
}
