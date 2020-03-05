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
export const make = tagFunction(
  (code: string) => compile(ast(asmLexer(code))),
);
