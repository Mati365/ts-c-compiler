import * as R from 'ramda';

import {IROpcode} from '../constants';
import {IRInstructionVarArg} from '../variables';
import {IRInstruction} from './IRInstruction';

export function isIRRetInstruction(instruction: IRInstruction): instruction is IRRetInstruction {
  return instruction.opcode === IROpcode.RET;
}

/**
 * IR return instruction
 *
 * @export
 * @class IRRetInstruction
 * @extends {IRInstruction}
 */
export class IRRetInstruction extends IRInstruction {
  constructor(
    readonly value?: IRInstructionVarArg,
  ) {
    super(IROpcode.RET);
  }

  isVoid() {
    return R.isNil(this.value);
  }

  override getDisplayName(): string {
    const {value} = this;

    return `ret ${value?.getDisplayName() || ''}`.trim();
  }
}
