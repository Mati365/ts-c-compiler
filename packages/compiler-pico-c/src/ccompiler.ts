import { ok } from '@compiler/core/monads/Result';
import { asm } from '@x86-toolkit/assembler/asm';

import { dumpAttributesToString, timingsToString } from '@compiler/core/utils';

import { TableBinaryView } from '@x86-toolkit/assembler/parser/compiler/view/TableBinaryView';
import { TreePrintVisitor } from '@compiler/grammar/tree/TreePrintVisitor';
import {
  CCompilerTimings,
  createCCompilerTimings,
} from './frontend/utils/createCCompilerTimings';
import { CCompilerConfig, CCompilerArch } from './constants/config';

import { ASTCCompilerNode } from './frontend/parser/ast';
import { IRResultView, IRCodeBuilderResult } from './frontend/ir';

import { isNewScopeASTNode } from './frontend/analyze/interfaces';
import { CScopeTree, CScopePrintVisitor } from './frontend/analyze';

import { cIRCompiler } from './frontend';
import { CBackendCompilerResult, genASMIRCode } from './backend';

/**
 * Output of compilation
 */
export class CCompilerOutput {
  constructor(
    readonly code: string,
    readonly ast: ASTCCompilerNode,
    readonly scope: CScopeTree,
    readonly ir: IRCodeBuilderResult,
    readonly codegen: CBackendCompilerResult,
    readonly timings: CCompilerTimings,
  ) {}

  static serializeTypedTree(ast: ASTCCompilerNode): string {
    return TreePrintVisitor.serializeToString<ASTCCompilerNode>(ast, {
      formatterFn: node =>
        dumpAttributesToString(node.toString(), {
          type: node.type?.toString(),
          scoped: isNewScopeASTNode(node) || null,
        }),
    });
  }

  dump() {
    const { scope, code, ir, timings, ast, codegen } = this;

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
        '\nCodegen:',
        '',
        codegen.asm,
        '\nAssembly:',
        '',
        TableBinaryView.serializeToString(
          asm(codegen.asm, { preprocessor: false }),
        ),
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
  const timings = createCCompilerTimings();

  return cIRCompiler(code, {
    ...ccompilerConfig,
    timings,
  })
    .andThen(
      timings.add('codegen', ({ ir, ...result }) =>
        genASMIRCode(ccompilerConfig, ir).andThen(codegen =>
          ok({
            ...result,
            codegen,
            ir,
          }),
        ),
      ),
    )
    .andThen(({ tree, scope, ir, codegen }) =>
      ok(new CCompilerOutput(code, tree, scope, ir, codegen, timings.unwrap())),
    );
}
