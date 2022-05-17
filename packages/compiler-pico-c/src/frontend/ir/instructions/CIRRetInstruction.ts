import * as R from 'ramda';

import {CIROpcode} from '../constants';
import {CIRInstructionVarArg} from '../variables';
import {CIRInstruction} from './CIRInstruction';

export function isIRRetInstruction(instruction: CIRInstruction): instruction is CIRRetInstruction {
  return instruction.opcode === CIROpcode.RET;
}

/**
 * IR return instruction
 *
 * @export
 * @class CIRRetInstruction
 * @extends {CIRInstruction}
 */
export class CIRRetInstruction extends CIRInstruction {
  constructor(
    readonly value?: CIRInstructionVarArg,
  ) {
    super(CIROpcode.RET);
  }

  isVoid() {
    return R.isNil(this.value);
  }

  override getDisplayName(): string {
    const {value} = this;

    return `ret ${value?.getDisplayName() || ''}`.trim();
  }
}
