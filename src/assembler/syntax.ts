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

/*
  Best way to test if jmps works ok:
  jnc kill
  int3
  mov al, byte 2
  shit
  kill:
  mov al, byte 4
*/

/* eslint-disable no-console,@typescript-eslint/no-unused-expressions */
make`
  mov ax, 0xFF
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
