import {COMPILER_INSTRUCTIONS_SET} from '../../constants/instructionSetSchema';
import {COMPILER_REGISTERS_SET} from '../../constants/x86';

import {TIMES_TOKEN_NAME} from '../ast/critical/ASTTimes';
import {EQU_TOKEN_NAME} from '../ast/critical/ASTEqu';
import {tokenDefSize} from '../ast/def/ASTDef';

/**
 * Check if string phrase is asm language syntax
 *
 * @export
 * @param {string} token
 * @returns {boolean}
 */
export function isReservedKeyword(token: string): boolean {
  return !!(
    COMPILER_INSTRUCTIONS_SET[token]
      || COMPILER_REGISTERS_SET[token]
      || token === TIMES_TOKEN_NAME
      || token === EQU_TOKEN_NAME
      || tokenDefSize(token)
  );
}
