import {ok} from '@compiler/core/monads/Result';
import {
  dumpAttributesToString,
  timingsToString,
} from '@compiler/core/utils';

import {TreePrintVisitor} from '@compiler/grammar/tree/TreePrintVisitor';
import {CCompilerTimings} from './utils/createCCompilerTimings';
import {CCompilerConfig, CCompilerArch} from '../constants/config';

import {ASTCCompilerNode} from './parser/ast';
import {IRResultView, IRCodeBuilderResult} from './ir';
import {
  CScopeTree,
  CScopePrintVisitor,
} from './analyze';

import {cIRCompiler} from './cIRcompiler';

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
    optimization: {
      enabled: true,
    },
  },
) {
  return (
    cIRCompiler(code, ccompilerConfig).andThen(({timings, ...result}) =>
      timings.add('compiler', ({tree, scope, ir}: typeof result) => ok(
        new CCompilerOutput(
          code,
          tree,
          scope,
          ir,
          timings.unwrap(),
        ),
      ))(result),
    )
  );
}
