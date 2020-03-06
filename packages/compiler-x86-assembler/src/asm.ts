import {tagFunction} from '@compiler/core/utils/tagFunction';
import {
  compile,
  ast,
  asmLexer,
} from './parser';

/**
 * Root of evil
 *
 * @param {String} code
 */
export const asm = tagFunction(
  (code: string) => compile(ast(asmLexer(code))),
);
