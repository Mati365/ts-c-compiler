import * as R from 'ramda';

import {IsPrintable} from '@compiler/core/interfaces';
import {Identity} from '@compiler/core/monads';
import {PartialBy} from '@compiler/core/types';

import {
  CArrayType, CPrimitiveType, CVariable,
  isArrayLikeType, isPrimitiveLikeType,
} from '../../analyze';

import {CIRError, CIRErrorCode} from '../errors/CIRError';

export type CIRVariableDescriptor = {
  prefix: string,
  suffix: number,
  type: CPrimitiveType | CArrayType,
};

/**
 * Single register variable
 *
 * @export
 * @class CIRVariable
 * @implements {IsPrintable}
 */
export class CIRVariable
  extends Identity<CIRVariableDescriptor>
  implements IsPrintable {

  /**
   * Inits new variable based on scope tree variable
   *
   * @static
   * @param {CVariable} variable
   * @return {CIRVariable}
   * @memberof CIRVariable
   */
  static ofScopeVariable(variable: CVariable): CIRVariable {
    const {type, name} = variable;

    if (!isPrimitiveLikeType(type) && !isArrayLikeType(type)) {
      throw new CIRError(
        CIRErrorCode.VARIABLE_MUST_BE_PRIMITIVE,
        {
          name: variable.getDisplayName(),
        },
      );
    }

    return new CIRVariable(
      {
        prefix: name,
        type,
      },
    );
  }

  constructor(value: PartialBy<CIRVariableDescriptor, 'suffix'>) {
    super(
      {
        suffix: 0,
        ...value,
      },
    );
  }

  get type() { return this.value.type; }
  get name() {
    const {prefix, suffix} = this.value;

    return `${prefix}${suffix}`;
  }

  /**
   * Creates new temp copy variable
   *
   * @param {number} suffix
   * @return {CIRVariable}
   * @memberof CIRVariable
   */
  ofSuffix(suffix: number): CIRVariable {
    return this.map(
      R.assoc('suffix', suffix),
    );
  }

  /**
   * Creates new cir variable of incremented suffix
   *
   * @return {CIRVariable}
   * @memberof CIRVariable
   */
  ofIncrementedSuffix(): CIRVariable {
    return this.map(R.evolve(
      {
        suffix: R.inc,
      },
    ));
  }

  getDisplayName(): string {
    const {type} = this.value;
    const {name} = this;

    return `${name} [${type.getShortestDisplayName()} ${type.getByteSize()}B]`;
  }
}
