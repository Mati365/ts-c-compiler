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
  jmp dupa
  int 3
  mov ax, word 2
  dupa:
  mov al, byte 1
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
