import {CVariableInitializerTree} from '../../analyze';
import {CVariableInitializerPrintVisitor} from '../../analyze/ast/initializer-builder';

import {IROpcode} from '../constants';
import {IRInstruction} from './IRInstruction';
import {IRVariable} from '../variables';
import {IsOutputInstruction} from '../interfaces';

export type IRConstDefData = number[];

export function isIRDefConstInstruction(instruction: IRInstruction): instruction is IRDefConstInstruction {
  return instruction.opcode === IROpcode.DEF_CONST;
}

/**
 * Label instruction
 *
 * @export
 * @class IRLabelInstruction
 * @extends {IRInstruction}
 */
export class IRDefConstInstruction extends IRInstruction implements IsOutputInstruction {
  constructor(
    readonly initializer: CVariableInitializerTree,
    readonly outputVar: IRVariable,
  ) {
    super(IROpcode.DEF_CONST);
  }

  override getDisplayName(): string {
    const {outputVar, initializer} = this;

    return (
      `${outputVar.getDisplayName()} = const ${CVariableInitializerPrintVisitor.serializeToString(initializer)}`
    );
  }
}
