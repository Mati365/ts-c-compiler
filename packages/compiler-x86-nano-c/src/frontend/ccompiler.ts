import {ok} from '@compiler/core/monads/Result';
import {timingsToString} from '@compiler/core/utils';

import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {TreePrintVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {CCompilerTimings, createCCompilerTimings} from './utils/createCCompilerTimings';

import './typecheck';
import {
  safeTreeGenerate, clexer,
  CLexerConfig,
} from './parser';

type CCompilerConfig = {
  lexer?: CLexerConfig,
};

/**
 * Output of compilation
 *
 * @export
 * @class CCompilerResult
 */
export class CCompilerOutput {
  constructor(
    public readonly code: string,
    public readonly ast: TreeNode,
    public readonly timings: CCompilerTimings,
  ) {}

  dump() {
    const {ast, code, timings} = this;
    const lines = [
      'Time:',
      `${timingsToString(timings)}\n`,
      'Source:',
      code,
      'Syntax tree:\n',
      TreePrintVisitor.valueOf(ast),
    ];

    console.info(lines.join('\n'));
  }
}

/**
 * Main compiler entry, compiles code to binary
 *
 * @see
 *  Flow:
 *  Lexer -> ASTGenerator -> ASTIRCompiler -> X86CodeGen
 *
 * @export
 * @param {string} code
 * @param {CCompilerConfig} ccompilerConfig
 * @returns
 */
export function ccompiler(code: string, ccompilerConfig: CCompilerConfig = {}) {
  const timings = createCCompilerTimings();

  return timings.add('lexer', clexer)(ccompilerConfig.lexer, code)
    .andThen(timings.add('ast', (tokens) => safeTreeGenerate(tokens)))
    .andThen(timings.add('compiler', (tree) => ok(
      new CCompilerOutput(
        code,
        tree,
        timings.unwrap(),
      ),
    )));
}
