import { isLineTerminatorToken } from '@ts-c-compiler/lexer';

import { TokenKind, TokenType, Token } from '@ts-c-compiler/lexer';
import { TokensIterator } from '@ts-c-compiler/grammar';

import { mergeTokensTexts } from '../compiler/utils';

/**
 * Fetches array of args such as:
 * ax, 0x55, byte ax
 */
export function fetchInstructionTokensArgsList(
  parser: TokensIterator,
  allowSizeOverride: boolean = true,
): Token[] {
  // parse arguments
  const argsTokens: Token[] = [];
  let argTokenBuffer: Token[] = [];

  function flushTokenBuffer() {
    if (!argTokenBuffer.length) {
      return;
    }

    if (argTokenBuffer.length === 1) {
      argsTokens.push(argTokenBuffer[0]);
    } else {
      // merge tokens (math expressions etc) into single token keyword
      argsTokens.push(
        new Token(
          TokenType.KEYWORD,
          null,
          mergeTokensTexts(argTokenBuffer, ' '),
          argTokenBuffer[0].loc,
        ),
      );
    }

    argTokenBuffer = [];
  }

  do {
    // value or size operand
    let token = parser.fetchRelativeToken();
    if (!token || isLineTerminatorToken(token)) {
      break;
    }

    // single spearator characters
    if (token.type === TokenType.COLON) {
      flushTokenBuffer();
      argsTokens.push(token);
    } else if (token.type === TokenType.COMMA) {
      flushTokenBuffer();
    } else {
      argTokenBuffer.push(token);
    }

    // far / near jmp instruction args prefix
    if (token.kind === TokenKind.BRANCH_ADDRESSING_TYPE) {
      flushTokenBuffer();
      token = parser.fetchRelativeToken();
      argsTokens.push(token);

      // if it was size operand - fetch next token which is prefixed
    } else if (
      allowSizeOverride &&
      token.kind === TokenKind.BYTE_SIZE_OVERRIDE
    ) {
      flushTokenBuffer();
      argsTokens.push(parser.fetchRelativeToken());
    }
  } while (true);

  flushTokenBuffer();
  return argsTokens;
}
