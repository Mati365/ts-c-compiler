import {TokenKind, TokenType, Token} from '@compiler/lexer/tokens';
import {ASTParser} from '../ast/ASTParser';

/**
 * Fetches array of args such as:
 * ax, 0x55, byte ax
 *
 * @export
 * @param {ASTParser} parser
 * @param {boolean} [allowSizeOverride=true]
 * @returns {Token[]}
 */
export function fetchInstructionTokensArgsList(
  parser: ASTParser,
  allowSizeOverride: boolean = true,
): Token[] {
  // parse arguments
  const argsTokens: Token[] = [];
  let separatorToken = null;

  do {
    // value or size operand
    let token = parser.fetchRelativeToken();
    if (!token || token.type === TokenType.EOL || token.type === TokenType.EOF)
      break;

    argsTokens.push(token);

    // far / near jmp instruction args prefix
    if (token.kind === TokenKind.BRANCH_ADDRESSING_TYPE) {
      token = parser.fetchRelativeToken();
      argsTokens.push(token);
    }

    // if it was size operand - fetch next token which is prefixed
    if (allowSizeOverride && token.kind === TokenKind.BYTE_SIZE_OVERRIDE) {
      argsTokens.push(
        parser.fetchRelativeToken(),
      );
    }

    // comma or other separator
    separatorToken = parser.fetchRelativeToken();

    // handle comma between numbers in some addressing modes
    if (separatorToken?.type === TokenType.COLON)
      argsTokens.push(separatorToken);
  } while (
    separatorToken && (
      separatorToken.type === TokenType.COMMA
        || separatorToken.type === TokenType.COLON
    )
  );

  return argsTokens;
}
