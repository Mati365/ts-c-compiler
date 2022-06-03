import {getIRTypeDisplayName} from '../dump';

import {IsOutputInstruction} from '../interfaces';
import {CType} from '../../analyze';

import {CIROpcode} from '../constants';
import {CIRInstruction} from './CIRInstruction';
import {CIRVariable} from '../variables/CIRVariable';
import chalk from 'chalk';

export function isIRAllocInstruction(instruction: CIRInstruction): instruction is CIRAllocInstruction {
  return instruction.opcode === CIROpcode.ALLOC;
}

/**
 * Allocs nth bytes for variable
 *
 * @export
 * @class CIRAllocInstruction
 * @extends {CIRInstruction}
 * @implements {IsOutputInstruction}
 */
export class CIRAllocInstruction extends CIRInstruction implements IsOutputInstruction {
  constructor(
    readonly outputVar: string,
    readonly type: CType,
  ) {
    super(CIROpcode.ALLOC);
  }

  static ofIRVariable(variable: CIRVariable) {
    return new CIRAllocInstruction(
      variable.name,
      variable.type,
    );
  }

  override getDisplayName(): string {
    const {type, outputVar} = this;

    return `${chalk.magentaBright('alloc')} ${chalk.blueBright(outputVar)}${getIRTypeDisplayName(type)}`;
  }
}
