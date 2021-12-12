import {ok} from '@compiler/core/monads/Result';
import {timingsToString} from '@compiler/core/utils';

import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {TreePrintVisitor} from '@compiler/grammar/tree/TreePrintVisitor';
import {CCompilerTimings, createCCompilerTimings} from './utils/createCCompilerTimings';

import {ASTCCompilerNode} from './parser/ast';
import {safeAssignTypesToTree} from './typecheck';
import {
  safeGenerateTree,
  clexer,
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
    public readonly ast: ASTCCompilerNode,
    public readonly timings: CCompilerTimings,
  ) {}

  dump() {
    const {ast, code, timings} = this;
    const tree = TreePrintVisitor.valueOf<ASTCCompilerNode>(
      ast,
      {
        formatterFn: (node) => TreeNode.dumpAttributesToString(
          node.toString(),
          {
            type: node.type?.toString(),
          },
        ),
      },
    );

    const lines = [
      'Time:',
      `${timingsToString(timings)}\n`,
      'Source:',
      code,
      'Syntax tree:\n',
      tree,
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
    .andThen(timings.add('ast', safeGenerateTree))
    .andThen(timings.add('typecheck', safeAssignTypesToTree))
    .andThen(timings.add('compiler', (tree) => ok(
      new CCompilerOutput(
        code,
        tree,
        timings.unwrap(),
      ),
    )));
}
