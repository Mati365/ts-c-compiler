import * as R from 'ramda';

export const isQuote = (c: string): boolean => c === '"' || c === '\'';

export const isBracket = (c: string): boolean => c === '[' || c === ']';

export const isNewline = R.equals('\n');

export const isWhitespace = R.test(/[\s]/);
