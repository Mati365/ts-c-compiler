import * as R from 'ramda';
import chalk from 'chalk';

import { getIRTypeDisplayName } from '../dump/getIRTypeDisplayName';

import { IsPrintable } from '@ts-c-compiler/core';
import { Identity } from '@ts-c-compiler/core';
import { CType, isPrimitiveLikeType } from '../../analyze/types';

export function isIRConstant(obj: any): obj is IRConstant {
  return R.is(Object, obj) && 'constant' in obj;
}

export type IRConstantDescriptor = {
  constant: number;
  type: CType;
};

/**
 * Constant literal used in expressions generators
 */
export class IRConstant extends Identity<IRConstantDescriptor> implements IsPrintable {
  static ofConstant(type: CType, constant: number) {
    if (isPrimitiveLikeType(type, true) && !type.isFloating()) {
      constant = Math.trunc(constant);
    }

    return new IRConstant({
      type,
      constant,
    });
  }

  get type() {
    return this.value.type;
  }
  get constant() {
    return this.value.constant;
  }

  ofType(type: CType) {
    return this.map(R.assoc('type', type));
  }

  mapConstant(fn: (constant: number) => number) {
    let constant = fn(this.constant);

    if (isPrimitiveLikeType(this.type, true) && !this.type.isFloating()) {
      constant = Math.trunc(constant);
    }

    return new IRConstant({
      type: this.type,
      constant,
    });
  }

  getDisplayName(): string {
    const { constant, type } = this.value;

    return `%${chalk.greenBright(constant)}${getIRTypeDisplayName(type)}`;
  }
}
