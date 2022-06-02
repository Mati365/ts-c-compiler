import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {CFunctionDeclType} from '@compiler/pico-c/frontend/analyze';
import {ASTCAssignmentExpression, ASTCCompilerKind, ASTCCompilerNode} from '@compiler/pico-c/frontend/parser';

import {CIRInstruction, CIRRetInstruction} from '../../instructions';
import {IREmitterContextAttrs} from './types';

import {emitScopeInitIR} from './emitScopeInitIR';
import {emitAssignmentIR} from './emitAssignmentIR';

type IREmitterFunctionResult = {
  instructions: CIRInstruction[];
};

type FunctionIREmitAttrs = IREmitterContextAttrs & {
  fnType: CFunctionDeclType;
};

export function emitFunctionIR(
  {
    context,
    scope,
    fnType,
  }: FunctionIREmitAttrs,
): IREmitterFunctionResult {
  const instructions: CIRInstruction[] = [
    context.allocator.allocFunctionType(fnType),
    ...emitScopeInitIR(
      {
        context,
        scope,
      },
    ).instructions,
  ];

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.Declaration]: false,
      [ASTCCompilerKind.AssignmentExpression]: {
        enter(node: ASTCAssignmentExpression) {
          const assignResult = emitAssignmentIR(
            {
              node,
              scope,
              context,
            },
          );

          instructions.push(...assignResult.instructions);
          return false;
        },
      },
    },
  )(fnType.definition);

  instructions.push(new CIRRetInstruction);
  return {
    instructions,
  };
}
