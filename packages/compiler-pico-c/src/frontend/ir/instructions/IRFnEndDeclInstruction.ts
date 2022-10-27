import chalk from 'chalk';

import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';

export function isIRFnEndDeclInstruction(instruction: IRInstruction): instruction is IRFnEndDeclInstruction {
  return instruction.opcode === IROpcode.FN_DECL_END;
}

/**
 * Instruction that indicates end of declaration (it is not RET)
 *
 * @export
 * @class IRFnEndDeclInstruction
 * @extends {IRInstruction}
 */
export class IRFnEndDeclInstruction extends IRInstruction {
  constructor() {
    super(IROpcode.FN_DECL_END);
  }

  override getDisplayName(): string {
    return chalk.bold.yellowBright('end-def');
  }
}
