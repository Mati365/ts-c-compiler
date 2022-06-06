import chalk from 'chalk';

import {getIRTypeDisplayName} from '../dump/getIRTypeDisplayName';
import {IsOutputInstruction} from '../interfaces';

import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';
import {IRVariable} from '../variables/IRVariable';
import {CPointerType, CType} from '../../analyze';

export function isIRAllocInstruction(instruction: IRInstruction): instruction is IRAllocInstruction {
  return instruction.opcode === IROpcode.ALLOC;
}

/**
 * Allocs nth bytes for variable
 *
 * @export
 * @class IRAllocInstruction
 * @extends {IRInstruction}
 * @implements {IsOutputInstruction}
 */
export class IRAllocInstruction extends IRInstruction implements IsOutputInstruction {
  static ofDestPtrVariable(variable: IRVariable) {
    return new IRAllocInstruction(
      (<CPointerType> variable.type).baseType,
      variable,
    );
  }

  constructor(
    readonly type: CType,
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.ALLOC);
  }

  override getDisplayName(): string {
    const {type, outputVar} = this;

    return (
      `${outputVar.getDisplayName()} = ${chalk.magentaBright('alloca')} ${getIRTypeDisplayName(type, false)}`
    );
  }
}
