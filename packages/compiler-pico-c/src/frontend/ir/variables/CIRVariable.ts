import * as R from 'ramda';

import {getIRTypeDisplayName} from '../dump';

import {IsPrintable} from '@compiler/core/interfaces';
import {Identity} from '@compiler/core/monads';
import {PartialBy} from '@compiler/core/types';
import {CType, CVariable} from '../../analyze';

export type CIRVariableDescriptor = {
  prefix: string,
  suffix: number,
  type: CType,
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
  get prefix() { return this.value.prefix; }
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
   * Changes original name of variable
   *
   * @param {string} name
   * @return {CIRVariable}
   * @memberof CIRVariable
   */
  ofPrefix(name: string): CIRVariable {
    return this.map(
      R.assoc('prefix', name),
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

    return `${name}${getIRTypeDisplayName(type)}`;
  }
}
