import {InstructionArgType} from '../../../../types';
import {RegisterSchema} from '../../../../constants';
import {X87RegisterSchema} from '../../../../constants/registersSet/x87';
import {ASTInstructionArg} from './ASTInstructionArg';

/**
 * Instruction arg that contains register
 *
 * @export
 * @class ASTInstructionRegisterArg
 * @extends {ASTInstructionArg}
 */
export class ASTInstructionRegisterArg extends ASTInstructionArg<RegisterSchema> {
  constructor(schema: RegisterSchema, byteSize: number) {
    super(
      InstructionArgType.REGISTER,
      schema,
      byteSize,
    );
  }
}

/**
 * Instruction arg that contains X87 register
 *
 * @export
 * @class ASTInstructionX87RegisterArg
 * @extends {ASTInstructionArg}
 */
export class ASTInstructionX87RegisterArg extends ASTInstructionArg<X87RegisterSchema> {
  constructor(schema: X87RegisterSchema) {
    super(
      InstructionArgType.X87_REGISTER,
      schema,
      null,
    );
  }
}
