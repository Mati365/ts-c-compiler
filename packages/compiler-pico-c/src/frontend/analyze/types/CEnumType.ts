import * as R from 'ramda';

import {dumpCompilerAttrs} from '@compiler/core/utils';

import {Result, err, ok} from '@compiler/core/monads';
import {CCompilerArch} from '@compiler/pico-c/constants';
import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';
import {CType, CTypeDescriptor} from './CType';
import {CPrimitiveType} from './CPrimitiveType';

export type CEnumFieldsMap = Map<string, number>;
export type CEnumDescriptor = CTypeDescriptor & {
  name?: string,
  fields: CEnumFieldsMap,
};

export function isEnumLikeType(type: CType): type is CEnumType {
  return type?.isEnum?.();
}

/**
 * Defines C-like enum with ints
 *
 * @export
 * @class CEnumType
 * @extends {CType<CStructTypeDescriptor>}
 */
export class CEnumType extends CType<CEnumDescriptor> {
  static ofBlank(arch: CCompilerArch, name?: string) {
    return new CEnumType(
      {
        arch,
        name,
        fields: new Map,
      },
    );
  }

  override isEnum() { return true; }

  get name() { return this.value.name; }
  get fields() { return this.value.fields; }

  /**
   * Appends new enumeration type
   *
   * @param {string} name
   * @param {number} value
   * @return {Result<CEnumType, CTypeCheckError>}
   * @memberof CEnumType
   */
  ofAppendedField(name: string, value: number): Result<CEnumType, CTypeCheckError> {
    return this.bind((state) => {
      if (this.hasField(name)) {
        return err(
          new CTypeCheckError(
            CTypeCheckErrorCode.REDEFINITION_OF_ENUM_ENTRY,
            null,
            {
              name,
            },
          ),
        );
      }

      return ok(new CEnumType(
        {
          ...state,
          fields: new Map(
            [
              ...this.getFieldsList(),
              [name, value],
            ],
          ),
        },
      ));
    });
  }

  override getDisplayName() {
    const {name, arch} = this;
    let fields = (
      this
        .getFieldsList()
        .map(([fieldName, value]) => `  ${fieldName} = ${value},`)
        .join('\n')
    );

    if (!R.isEmpty(fields))
      fields = `\n${fields}\n`;

    const enumAttrs = dumpCompilerAttrs(
      {
        arch,
        sizeof: this.getByteSize(),
      },
    );

    return `${enumAttrs} enum ${name || '<anonymous>'} {${fields}}`;
  }

  override getByteSize(): number {
    return this.getEntryValueType().getByteSize();
  }

  getEntryValueType() {
    return CPrimitiveType.int(this.arch);
  }

  hasField(name: string) {
    return this.fields.has(name);
  }

  getField(name: string) {
    return this.fields.get(name);
  }

  getFieldsList(): [string, number][] {
    return [...this.fields.entries()];
  }
}
