import { TokenType, Token } from '@ts-cc/lexer';
import { InstructionPrefix, COMPILER_INSTRUCTIONS_SET } from '../../../../constants';

/**
 * Returns true if token might be beginning of instruction
 */
export function isTokenInstructionBeginning(token: Token): boolean {
  if (
    token.type !== TokenType.KEYWORD ||
    (!COMPILER_INSTRUCTIONS_SET[token.lowerText] && !InstructionPrefix[token.upperText])
  ) {
    return false;
  }

  return true;
}
