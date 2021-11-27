import {ok} from '@compiler/core/monads/Result';
import {timingsToString} from '@compiler/core/utils';

import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {TreePrintVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {CCompilerTimings, createCCompilerTimings} from './utils/createCCompilerTimings';

import {clexer, CLexerConfig} from './lexer/clexer';
import {safeTreeGenerate} from './grammar';
import {safeSAACodegen} from './ssa/codegen';

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

  return clexer(ccompilerConfig.lexer, code)
    .andThen(timings.add('lexer', (tokens) => safeTreeGenerate(tokens)))
    .andThen(timings.add('ast', (ast) => safeSAACodegen(ast)))
    .andThen((result) => ok(
      new CCompilerOutput(
        code,
        result.tree,
        timings.unwrap(),
      )),
    );
}
