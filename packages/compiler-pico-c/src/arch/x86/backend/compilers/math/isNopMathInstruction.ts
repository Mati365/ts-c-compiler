import { TokenType } from '@ts-c/lexer';
import { IRMathInstruction } from 'frontend/ir/instructions';

export function isNopMathInstruction(instruction: IRMathInstruction): boolean {
  switch (instruction.operator) {
    case TokenType.MUL:
      if (
        instruction.hasAnyConstantArg() &&
        !instruction.hasBothConstantArgs()
      ) {
        const constantArg = instruction.getFirstConstantArg();

        if (constantArg.constant === 0x1) {
          return true;
        }
      }
      break;

    case TokenType.PLUS:
      if (
        instruction.hasAnyConstantArg() &&
        !instruction.hasBothConstantArgs()
      ) {
        const constantArg = instruction.getFirstConstantArg();

        if (constantArg.constant === 0x0) {
          return true;
        }
      }
      break;
  }

  return false;
}
