import { InstructionArgType } from '../../../../types';
import { RegisterSchema } from '../../../../constants';
import { ASTInstructionArg } from './ASTInstructionArg';

/**
 * Instruction arg that contains register
 */
export class ASTInstructionRegisterArg extends ASTInstructionArg<RegisterSchema> {
  constructor(schema: RegisterSchema, byteSize: number) {
    super(InstructionArgType.REGISTER, schema, byteSize);
  }
}
