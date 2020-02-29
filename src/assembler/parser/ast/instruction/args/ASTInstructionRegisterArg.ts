import {InstructionArgType} from '../../../../types';
import {ASTInstructionArg} from './ASTInstructionArg';
import {RegisterSchema} from '../../../../shared/RegisterSchema';

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
