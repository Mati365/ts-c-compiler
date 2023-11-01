import { asm } from '@ts-c-compiler/x86-assembler';

import { timingsToString } from '@ts-c-compiler/core';
import { TableBinaryView } from '@ts-c-compiler/x86-assembler';

import type { CCompilerTimings } from '../frontend/utils/createCCompilerTimings';
import type { ASTCCompilerNode } from '../frontend/parser/ast';

import { IRResultView, type IRCodeBuilderResult } from '../frontend/ir';

import { CScopePrintVisitor, type CScopeTree } from '../frontend/analyze';
import { serializeTypedTreeToString } from '../frontend/parser';

import type { CBackendCompilerResult } from '../backend';

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

  dump() {
    const { scope, code, ir, timings, ast, codegen } = this;

    console.info(
      [
        'Time:',
        `${timingsToString(timings)}\n`,
        'Source:',
        code,
        'Syntax tree:\n',
        serializeTypedTreeToString(ast),
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
          asm({ preprocessor: true })(codegen.asm),
        ),
        '',
      ].join('\n'),
    );
  }
}
