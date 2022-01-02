import {ok} from '@compiler/core/monads/Result';
import {
  dumpAttributesToString,
  timingsToString,
} from '@compiler/core/utils';

import {TreePrintVisitor} from '@compiler/grammar/tree/TreePrintVisitor';
import {CCompilerTimings, createCCompilerTimings} from './utils/createCCompilerTimings';
import {CCompilerConfig, CCompilerArch} from '../constants/config';

import {ASTCCompilerNode} from './parser/ast';
import {safeGenerateTree, clexer} from './parser';
import {
  safeBuildTypedTree,
  CScopeTree,
  CScopePrintVisitor,
} from './analyze';

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
    public readonly scope: CScopeTree,
    public readonly timings: CCompilerTimings,
  ) {}

  dump() {
    const {ast, scope, code, timings} = this;

    const scopeTree = CScopePrintVisitor.serializeToString(scope);
    const tree = TreePrintVisitor.serializeToString<ASTCCompilerNode>(
      ast,
      {
        formatterFn: (node) => dumpAttributesToString(
          node.toString(),
          {
            type: node.type?.toString(),
          },
        ),
      },
    );

    console.info(
      [
        'Time:',
        `${timingsToString(timings)}\n`,
        'Source:',
        code,
        'Syntax tree:\n',
        tree,
        'Scope tree:\n',
        scopeTree,
        '',
      ].join('\n'),
    );
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
export function ccompiler(
  code: string,
  ccompilerConfig: CCompilerConfig = {
    arch: CCompilerArch.X86_16,
  },
) {
  const timings = createCCompilerTimings();

  return timings.add('lexer', clexer)(ccompilerConfig.lexer, code)
    .andThen(timings.add('ast', safeGenerateTree))
    .andThen(timings.add('analyze', (tree) => safeBuildTypedTree(ccompilerConfig, tree)))
    .andThen(timings.add('compiler', ({tree, scope}) => ok(
      new CCompilerOutput(
        code,
        tree,
        scope,
        timings.unwrap(),
      ),
    )));
}
