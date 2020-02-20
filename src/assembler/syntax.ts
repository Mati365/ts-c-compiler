import {tagFunction} from './utils/tagFunction';
import {
  compile,
  ast,
  lexer,
} from './parser';

/**
 * Root of evil
 *
 * @param {String} code
 */
const make = tagFunction(
  (code: string) => compile(ast(lexer(code))),
);

/* eslint-disable no-console,@typescript-eslint/no-unused-expressions */
make`
  mov al, byte [si + 0xFF]
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
