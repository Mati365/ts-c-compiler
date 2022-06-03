import * as R from 'ramda';
import chalk from 'chalk';

import {getIRTypeDisplayName} from '../dump';

import {IsPrintable} from '@compiler/core/interfaces';
import {Identity} from '@compiler/core/monads';
import {CType} from '../../analyze';

export function isCIRConstant(obj: any): obj is CIRConstant {
  return R.is(Object, obj) && ('constant' in obj);
}

export type CIRConstantDescriptor = {
  constant: number,
  type: CType,
};

/**
 * Constant literal used in expressions generators
 *
 * @export
 * @class CIRConstantDescriptor
 * @implements {IsPrintable}
 */
export class CIRConstant
  extends Identity<CIRConstantDescriptor>
  implements IsPrintable {

  static ofConstant(type: CType, constant: number) {
    return new CIRConstant(
      {
        type,
        constant,
      },
    );
  }

  get type() { return this.value.type; }
  get constant() { return this.value.constant; }

  mapConstant(fn: (constant: number) => number) {
    return new CIRConstant(
      {
        type: this.type,
        constant: fn(this.constant),
      },
    );
  }

  getDisplayName(): string {
    const {constant, type} = this.value;

    return `%${chalk.greenBright(constant)}${getIRTypeDisplayName(type)}`;
  }
}
