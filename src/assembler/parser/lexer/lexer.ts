import * as R from 'ramda';

import {
  isQuote,
  isNewline,
} from '../../utils/matchCharacter';

import Token, {TokenLocation, TOKEN_PARSERS, TOKEN_TYPES} from './Token';

/**
 * Analyze single token
 *
 * @param {TokenLocation} locaiton
 * @param {String} token
 */
const parseToken = (location, token) => {
  if (!token || !token.length)
    return null;

  for (const tokenType in TOKEN_PARSERS) {
    const result = TOKEN_PARSERS[tokenType](token);
    if (!result)
      continue;

    // result might return boolean return from has() function
    if (result === true)
      return new Token(tokenType, token, location.clone());

    // it might be also object without type
    if (!result?.type)
      return new Token(tokenType, token, location.clone(), result);

    return result;
  }

  throw new Error(`Unknown "${token}" token!`);
};

/**
 * Split code into tokens
 *
 * @see
 *  It contains also lexer logic!
 *
 * @param {String} code
 *
 * @returns {Token[]}
 */
function* lexer(code) {
  const {length} = code;

  let tokenBuffer = '';
  const location = new TokenLocation;

  function* appendToken(token) {
    if (!token)
      return;

    tokenBuffer = '';
    yield token;
  }

  function* appendCharToken(type, character) {
    if (R.trim(tokenBuffer).length) {
      yield* appendToken(
        parseToken(location, tokenBuffer),
      );
    }

    yield* appendToken(
      new Token(
        type,
        character,
        location.clone(),
      ),
    );
  }

  for (let i = 0; i < length; ++i) {
    const character = code[i];
    const newLine = isNewline(character);

    // used for logger
    if (newLine) {
      location.column = 0;
      location.row++;
    } else
      location.column++;

    // special quote token, ignore all content, mark as ignored area
    if (isQuote(character)) {
      tokenBuffer = '';
      for (i++; i < length && !isQuote(code[i]); ++i)
        tokenBuffer += code[i];

      yield* appendToken(
        new Token(
          TOKEN_TYPES.QUOTE,
          tokenBuffer,
          location.clone(),
        ),
      );
      continue;
    }


    if (newLine)
      yield* appendCharToken(TOKEN_TYPES.EOL, character);
    else if (character === ',')
      yield* appendCharToken(TOKEN_TYPES.COMMA, character);
    else if (character !== ' ') {
      // append character and find matching token
      tokenBuffer += character;
    } else {
      // if empty character
      yield* appendToken(
        parseToken(location, tokenBuffer),
      );
    }
  }

  yield* appendCharToken(TOKEN_TYPES.EOF, null);
}

export default lexer;
