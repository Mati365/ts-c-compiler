import { CVariableInitializerTree } from '../../analyze';
import { CVariableInitializerPrintVisitor } from '../../analyze/ast/initializer-builder';

import { IROpcode } from '../constants';
import { IRInstruction, IRInstructionArgs } from './IRInstruction';
import { IRVariable } from '../variables';
import { IsOutputInstruction } from '../interfaces';

export function isIRDefDataInstruction(
  instruction: IRInstruction,
): instruction is IRDefDataInstruction {
  return instruction.opcode === IROpcode.DEF_DATA;
}

/**
 * Label instruction
 */
export class IRDefDataInstruction
  extends IRInstruction
  implements IsOutputInstruction
{
  constructor(
    readonly initializer: CVariableInitializerTree,
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.DEF_DATA);
  }

  override ofArgs({ output = this.outputVar }: IRInstructionArgs) {
    return new IRDefDataInstruction(this.initializer, output);
  }

  override getArgs(): IRInstructionArgs {
    return {
      input: [],
      output: this.outputVar,
    };
  }

  override getDisplayName(): string {
    const { outputVar, initializer } = this;

    return `${outputVar.getDisplayName()} = const ${CVariableInitializerPrintVisitor.serializeToString(
      initializer,
    )}`;
  }
}
