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
import {IRResultView, IRCodeBuilderResult, safeBuildIRCode} from './ir';
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
    readonly code: string,
    readonly ast: ASTCCompilerNode,
    readonly scope: CScopeTree,
    readonly ir: IRCodeBuilderResult,
    readonly timings: CCompilerTimings,
  ) {}

  static serializeTypedTree(ast: ASTCCompilerNode): string {
    return TreePrintVisitor.serializeToString<ASTCCompilerNode>(
      ast,
      {
        formatterFn: (node) => dumpAttributesToString(
          node.toString(),
          {
            type: node.type?.toString(),
            scoped: node.scope ? true : null,
          },
        ),
      },
    );
  }

  dump() {
    const {scope, code, ir, timings, ast} = this;

    console.info(
      [
        'Time:',
        `${timingsToString(timings)}\n`,
        'Source:',
        code,
        'Syntax tree:\n',
        CCompilerOutput.serializeTypedTree(ast),
        'Scope tree:\n',
        CScopePrintVisitor.serializeToString(scope),
        '\nIR:',
        '',
        IRResultView.serializeToString(ir),
        '\n',
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
    .andThen(timings.add(
      'ir',
      (result) => safeBuildIRCode(ccompilerConfig, result.scope).andThen((ir) => ok({
        ...result,
        ir,
      })),
    ))
    .andThen(timings.add('compiler', ({tree, scope, ir}) => ok(
      new CCompilerOutput(
        code,
        tree,
        scope,
        ir,
        timings.unwrap(),
      ),
    )));
}
