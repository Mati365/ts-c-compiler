import * as R from 'ramda';

export const isQuote = c => c === '"' || c === '\'';

export const isNewline = R.equals('\n');

export const isWhitespace = R.test(/[\s]/);
