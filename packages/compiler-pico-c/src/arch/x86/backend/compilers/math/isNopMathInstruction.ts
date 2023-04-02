import { TokenType } from '@compiler/lexer/shared';
import { IRMathInstruction } from '@compiler/pico-c/frontend/ir/instructions';

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
