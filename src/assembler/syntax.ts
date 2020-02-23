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
  int3
  hlt
  abc:
  mov al, 3
  jmp abc
  jmp dupa_blada
  int 32
  dupa_blada:
  int 4
`;
/* eslint-enable no-console,@typescript-eslint/no-unused-expressions */
