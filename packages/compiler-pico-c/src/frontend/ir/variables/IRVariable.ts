import * as R from 'ramda';
import chalk from 'chalk';

import { getIRTypeDisplayName } from '../dump/getIRTypeDisplayName';

import { IsPrintable } from '@compiler/core/interfaces';
import { Identity } from '@compiler/core/monads';
import { PartialBy } from '@compiler/core/types';
import { CPointerType, CType, CVariable } from '../../analyze';

export function isIRVariable(obj: any): obj is IRVariable {
  return R.is(Object, obj) && obj.value && obj.value.prefix;
}

export type IRVariableDescriptor = {
  prefix: string;
  suffix: number;
  type: CType;
  temp?: boolean;
  constInitialized?: boolean;
};

/**
 * Single register variable
 */
export class IRVariable
  extends Identity<IRVariableDescriptor>
  implements IsPrintable
{
  /**
   * Inits new variable based on scope tree variable
   */
  static ofScopeVariable(variable: CVariable): IRVariable {
    const { type, name } = variable;

    return new IRVariable({
      prefix: name,
      type,
    });
  }

  constructor(value: PartialBy<IRVariableDescriptor, 'suffix'>) {
    super({
      suffix: 0,
      ...value,
    });
  }

  get constInitialized() {
    return this.value.constInitialized;
  }

  get type() {
    return this.value.type;
  }

  get prefix() {
    return this.value.prefix;
  }

  get suffix() {
    return this.value.suffix;
  }

  get name() {
    const { prefix, suffix } = this.value;

    return `${prefix}{${suffix}}`;
  }

  isTemporary() {
    return this.value.temp;
  }

  isAnonymous() {
    return R.isNil(this.prefix);
  }

  /**
   * Indicates that variable is initialized .data
   */
  ofConstInitialized(): IRVariable {
    return this.map(R.assoc('constInitialized', true));
  }

  /**
   * Transform internal type to pointer
   */
  ofPointerType(): IRVariable {
    return this.map(value => ({
      ...value,
      type: CPointerType.ofType(value.type),
    }));
  }

  /**
   * Creates new temp copy variable
   */
  ofSuffix(suffix: number): IRVariable {
    return this.map(R.assoc('suffix', suffix));
  }

  /**
   * Changes original name of variable
   */
  ofPrefix(name: string): IRVariable {
    return this.map(R.assoc('prefix', name));
  }

  /**
   * Creates new cir variable of incremented suffix
   */
  ofIncrementedSuffix(): IRVariable {
    return this.map(
      R.evolve({
        suffix: R.inc,
      }),
    );
  }

  ofDecrementedSuffix() {
    return this.map(
      R.evolve({
        suffix: R.dec,
      }),
    );
  }

  ofType(type: CType) {
    return this.map(R.assoc('type', type));
  }

  ofTemp() {
    return this.map(R.assoc('temp', true));
  }

  getDisplayName(withType: boolean = true): string {
    const { type } = this.value;
    const { name } = this;

    return `${chalk.blueBright(name)}${
      withType ? getIRTypeDisplayName(type) : ''
    }`;
  }

  isShallowEqual(variable: IRVariable) {
    return this.name === variable?.name;
  }
}
