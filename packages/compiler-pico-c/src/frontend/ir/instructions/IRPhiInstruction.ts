import {IsOutputInstruction} from '../interfaces';

import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';
import {IRVariable} from '../variables';

/**
 * PHI instruction
 *
 * @export
 * @class IRPhiInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRPhiInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly vars: string[],
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.PHI);
  }

  override getDisplayName(): string {
    const {outputVar, vars} = this;

    return `${outputVar} = φ(${vars.join(', ')})`;
  }
}
