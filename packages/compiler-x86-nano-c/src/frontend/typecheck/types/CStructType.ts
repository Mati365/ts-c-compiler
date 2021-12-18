import * as R from 'ramda';

import {Identity} from '@compiler/core/monads';
import {CType} from './CType';
import {CPrimitiveType} from './CPrimitiveType';

export type CStructTypeEntryPair = [string, CType];
export type CStructTypeDescriptor = {
  name?: string,
  fields: Map<string, CType>,
};

/**
 * Defines C-like structure
 *
 * @export
 * @class CStructType
 * @extends {CType<CStructTypeDescriptor>}
 */
export class CStructType extends CType<CStructTypeDescriptor> {
  static ofBlank() {
    return new CStructType(
      {
        fields: new Map,
      },
    );
  }

  get name() {
    return this.value.name;
  }

  /**
   * Appends new type to newly created struct
   *
   * @param {CType} type
   * @param {string} name
   * @return {CStructType}
   * @memberof CStructType
   */
  ofAppendedField(type: CType, name: string): CStructType {
    return this.map((value) => ({
      ...value,
      fields: new Map([
        ...this.getFieldsList(),
        [name, type],
      ]),
    }));
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
    if (!(value instanceof CStructType))
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

  getFieldsList(): CStructTypeEntryPair[] {
    return [...this.value.fields.entries()];
  }

  getByteSize(): number {
    return CPrimitiveType.int.getByteSize();
  }

  getDisplayName(): string {
    const {name} = this;
    let fields = (
      this
        .getFieldsList()
        .map(([fieldName, type]) => `  ${type.getDisplayName()} ${fieldName};`)
        .join('\n')
    );

    if (!R.isEmpty(fields))
      fields = `\n${fields}\n`;

    return `struct ${name || '<anonymous>'} {${fields}}`;
  }
}
