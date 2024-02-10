import * as R from 'ramda';
import { replaceEscapeSequences } from '@ts-c-compiler/core';

import {
  isComment,
  isNewline,
  matchQuote,
  matchBracket,
  flipBracket,
  isWhitespace,
} from './utils/matchCharacter';

import { LexerError, LexerErrorCode } from './shared/LexerError';
import { TokenType, TokenLocation, TokenKind } from './shared';
import { Token, IdentifierToken } from './tokens';

export type IdentifiersMap = Record<string, number | string>;

export type TokenTerminalCharactersMap = {
  [operator: string]: TokenType;
};

export type TokenParsersMap = {
  [parser: string]: (token?: string, loc?: TokenLocation) => boolean | Token;
};

export const TERMINAL_CHARACTERS: TokenTerminalCharactersMap = {
  // single
  '?': TokenType.QUESTION_MARK,
  ',': TokenType.COMMA,
  ':': TokenType.COLON,
  ';': TokenType.SEMICOLON,
  '+': TokenType.PLUS,
  '-': TokenType.MINUS,
  '*': TokenType.MUL,
  '/': TokenType.DIV,
  '!': TokenType.NOT,
  '&': TokenType.BIT_AND,
  '|': TokenType.BIT_OR,
  '^': TokenType.POW,

  // binary
  '<<': TokenType.BIT_SHIFT_LEFT,
  '>>': TokenType.BIT_SHIFT_RIGHT,
  '==': TokenType.EQUAL,
  '!=': TokenType.DIFFERS,
  '>': TokenType.GREATER_THAN,
  '>=': TokenType.GREATER_EQ_THAN,
  '<': TokenType.LESS_THAN,
  '<=': TokenType.LESS_EQ_THAN,
  '&&': TokenType.AND,
  '||': TokenType.OR,
  '++': TokenType.INCREMENT,
  '--': TokenType.DECREMENT,

  // assign
  '=': TokenType.ASSIGN,
  '*=': TokenType.MUL_ASSIGN,
  '/=': TokenType.DIV_ASSIGN,
  '%=': TokenType.MOD_ASSIGN,
  '+=': TokenType.ADD_ASSIGN,
  '-=': TokenType.SUB_ASSIGN,
  '<<=': TokenType.SHIFT_LEFT_ASSIGN,
  '>>=': TokenType.SHIFT_RIGHT_ASSIGN,
  '&=': TokenType.AND_ASSIGN,
  '^=': TokenType.XOR_ASSIGN,
  '|=': TokenType.OR_ASSIGN,

  // other
  '...': TokenType.ELLIPSIS,
};

/**
 * Analyze single token
 */
function parseToken(config: LexerConfig, location: TokenLocation, token: string): Token {
  if (!token || !token.length) {
    return null;
  }

  const { identifiers, tokensParsers, ignoreSpecifiersCase = true } = config;

  const loc = location.clone();
  loc.column -= token.length;

  const identifier =
    identifiers && identifiers[ignoreSpecifiersCase ? R.toLower(token) : token];

  if (!R.isNil(identifier)) {
    return new IdentifierToken(identifier, token, loc);
  }

  for (const tokenType in tokensParsers) {
    const result = tokensParsers[tokenType](token, loc);

    if (!result) {
      continue;
    }

    // result might return boolean return from has() function
    if (result === true) {
      return new Token(<any>tokenType, null, token, loc);
    }

    // it might be also object without type
    if (!result.type) {
      return new Token(<any>tokenType, null, token, loc, result);
    }

    return result;
  }

  throw new LexerError(LexerErrorCode.UNKNOWN_TOKEN, null, {
    token,
  });
}

/**
 * Flags used for parsing flow control
 */
export type LexerConfig = {
  commentParser?(code: string, offset: number, character: string): number;
  tokensParsers?: TokenParsersMap;
  appendEOF?: boolean;
  ignoreEOL?: boolean;
  signOperatorsAsSeparateTokens?: boolean;
  terminalCharacters?: TokenTerminalCharactersMap;
  identifiers?: IdentifiersMap;
  ignoreSpecifiersCase?: boolean;
  allowBracketPrefixKeyword?: boolean; // dupa[xD]
  consumeBracketContent?: boolean;
};

/**
 * Split code into tokens
 *
 * @see
 *  It contains also lexer logic!
 */
export const lexer = (config: LexerConfig) =>
  function* (code: string): IterableIterator<Token> {
    const {
      commentParser,
      allowBracketPrefixKeyword,
      terminalCharacters = TERMINAL_CHARACTERS,
      ignoreEOL,
      appendEOF = true,
      signOperatorsAsSeparateTokens = false,
      consumeBracketContent = true,
    } = config;

    const { length } = code;
    const location = new TokenLocation();

    let tokenBuffer = '';
    let offset = 0;

    function* appendToken(token: Token): Iterable<Token> {
      if (!token) {
        return;
      }

      tokenBuffer = '';
      yield token;
    }

    /**
     * Handles single character terminals such as a b c
     */
    function* appendCharToken(
      type: TokenType,
      character: string,
    ): IterableIterator<Token> {
      if (tokenBuffer.length) {
        const trimmedTokenBuffer = R.trim(tokenBuffer);

        if (trimmedTokenBuffer.length) {
          // it clears tokenBuffer
          yield* appendToken(parseToken(config, location, trimmedTokenBuffer));
        }

        tokenBuffer = '';
      }

      yield* appendToken(new Token(type, null, character, location.clone()));
    }

    /**
     * Handles sequention of characters like "abc asd"
     */
    function* appendTokenWithSpaces(
      type: TokenType,
      kind: TokenKind,
      fetchUntil: (str: string) => boolean,
    ): Iterable<Token> {
      tokenBuffer = '';

      for (; ; ++offset) {
        if (code[offset] === '\\') {
          const nextCharacter = code[offset + 1];
          tokenBuffer += `${code[offset]}${nextCharacter}`;
          ++offset;
          continue;
        }

        if (fetchUntil(code[offset])) {
          break;
        }

        if (offset >= length) {
          throw new LexerError(LexerErrorCode.UNTERMINATED_STRING);
        }

        tokenBuffer += code[offset];
      }

      yield* appendToken(
        new Token(type, kind, replaceEscapeSequences(tokenBuffer), location.clone()),
      );

      tokenBuffer = '';
    }

    /**
     * Parses single character, appends it to token buffer and conditionally flushes
     */
    function* parseCharacter(character: string, eol: boolean) {
      // break line character
      if (character === '\\') {
        offset++;
        for (; offset < code.length; ++offset) {
          if (isNewline(code[offset])) {
            ++offset;
            break;
          }
        }
        return;
      }

      // ignore line, it is comment
      if (commentParser) {
        const newOffset = commentParser(code, offset, character);
        if (newOffset !== null) {
          offset = newOffset;
          return;
        }
      } else if (isComment(character)) {
        for (; offset < length; ++offset) {
          if (isNewline(code[offset + 1])) {
            break;
          }
        }
        return;
      }

      // special tokens that might contain spaces inside them
      const quote = matchQuote(character);
      if (quote) {
        if (tokenBuffer) {
          throw new LexerError(LexerErrorCode.UNKNOWN_TOKEN, null, {
            token: tokenBuffer,
          });
        }

        offset++;
        yield* appendTokenWithSpaces(TokenType.QUOTE, quote, R.equals(character));
        return;
      }

      const bracket = matchBracket(character);
      if (bracket) {
        if (tokenBuffer) {
          // handle case test[123]
          if (allowBracketPrefixKeyword && character === '(') {
            // if empty character
            yield* appendToken(
              new Token(
                TokenType.KEYWORD,
                TokenKind.BRACKET_PREFIX,
                tokenBuffer,
                location.clone(),
              ),
            );
          } else {
            yield* appendToken(parseToken(config, location, tokenBuffer));
          }
        }

        if (consumeBracketContent) {
          const flippedBracket = flipBracket(character);
          let nesting = 1;

          offset++;
          yield* appendTokenWithSpaces(TokenType.BRACKET, bracket, c => {
            if (c === character) {
              nesting++;
            } else if (c === flippedBracket) {
              nesting--;
            }

            return nesting <= 0;
          });
        } else {
          yield* appendToken(
            new Token(TokenType.BRACKET, bracket, character, location.clone()),
          );
        }

        return;
      }

      // end of line
      if (eol && !ignoreEOL) {
        yield* appendCharToken(TokenType.EOL, character);
      } else {
        // handle ++, && etc. two byte terminals
        const binarySeparator = character + code[offset + 1];
        const ternarySeparator = binarySeparator + code[offset + 2];

        if (terminalCharacters[ternarySeparator]) {
          offset += 2;
          yield* appendCharToken(terminalCharacters[ternarySeparator], ternarySeparator);
        } else if (terminalCharacters[binarySeparator]) {
          offset++;
          yield* appendCharToken(terminalCharacters[binarySeparator], binarySeparator);
        } else {
          // handle single character terminals
          const separator = terminalCharacters[character];
          if (separator) {
            // numbers - +1, -2, - 2, + 2
            if (
              !signOperatorsAsSeparateTokens &&
              (separator === TokenType.PLUS || separator === TokenType.MINUS) &&
              Number.isInteger(+code[offset + 1])
            ) {
              tokenBuffer += character;
            } else {
              yield* appendCharToken(separator, character);
            }
          } else if (!isWhitespace(character)) {
            // append character and find matching token
            tokenBuffer += character;
          } else if (tokenBuffer.length) {
            // if empty character
            yield* appendToken(parseToken(config, location, tokenBuffer));
          }
        }
      }
    }

    for (; offset < length; ) {
      const character = code[offset];
      const eol = isNewline(character);
      const preParseOffset = offset;

      yield* parseCharacter(character, eol);

      // used for logger
      ++offset;
      if (eol) {
        location.column = 0;
        location.row++;
      } else {
        location.column += offset - preParseOffset;
      }
    }

    if (tokenBuffer) {
      yield* appendToken(parseToken(config, location, tokenBuffer));
    }

    // end of file
    if (appendEOF) {
      yield* appendCharToken(TokenType.EOF, null);
    }
  };
