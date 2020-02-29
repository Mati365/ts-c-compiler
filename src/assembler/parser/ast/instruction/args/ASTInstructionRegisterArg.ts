import {InstructionArgType} from '../../../../types';
import {ASTInstructionArg} from './ASTInstructionArg';
import {RegisterSchema} from '../../../../shared/RegisterSchema';

/**
 * Instruction arg that contains register
 *
 * @export
 * @class ASTRegisterInstructionArg
 * @extends {ASTInstructionArg}
 */
export class ASTRegisterInstructionArg extends ASTInstructionArg<RegisterSchema> {
  constructor(schema: RegisterSchema, byteSize: number) {
    super(
      InstructionArgType.REGISTER,
      schema,
      byteSize,
    );
  }
}
