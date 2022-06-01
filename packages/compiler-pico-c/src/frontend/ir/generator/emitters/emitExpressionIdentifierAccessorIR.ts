import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType, CType, isArrayLikeType} from '@compiler/pico-c/frontend/analyze';
import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCPostfixArrayExpression,
  ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {
  CIRInstruction, CIRLeaInstruction,
  CIRLoadInstruction, CIRMathInstruction,
} from '../../instructions';

import {
  CIRConstant, CIRInstructionVarArg,
  CIRVariable, isCIRVariable,
} from '../../variables';

import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';
import {IsOutputInstruction} from '../../interfaces';
import {CIRError, CIRErrorCode} from '../../errors/CIRError';

import type {ExpressionIREmitAttrs} from './emitExpressionIR';

type ExpressionVarAccessorIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
  emitExpressionIR(attrs: ExpressionIREmitAttrs): IREmitterExpressionResult;
};

export function emitExpressionIdentifierAccessorIR(
  {
    scope,
    context,
    node,
    emitExpressionIR,
  }: ExpressionVarAccessorIREmitAttrs,
): IREmitterExpressionResult {
  const {allocator, config} = context;
  const instructions: (CIRInstruction & IsOutputInstruction)[] = [];

  let lastIRAddressVar: CIRVariable = null;
  let reducedType: CType = null;

  const allocAddressVar = () => allocator.allocTmpVariable(
    CPrimitiveType.int(config.arch),
  );

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.PrimaryExpression]: {
        enter(expr: ASTCPrimaryExpression) {
          if (!expr.isIdentifier())
            return;

          const rootIRVar = allocator.getVariable(expr.identifier.text);

          reducedType = rootIRVar.type;
          lastIRAddressVar = allocAddressVar();
          instructions.push(
            new CIRLeaInstruction(lastIRAddressVar.name, rootIRVar),
          );
        },
      },

      [ASTCCompilerKind.PostfixArrayExpression]: {
        enter(expr: ASTCPostfixArrayExpression) {
          if (lastIRAddressVar) {
            if (!isArrayLikeType(reducedType))
              throw new CIRError(CIRErrorCode.ACCESS_ARRAY_INDEX_TO_NON_ARRAY);

            const {
              instructions: exprInstructions,
              output: exprOutput,
            } = emitExpressionIR(
              {
                parentVar: lastIRAddressVar,
                node: expr,
                context,
                scope,
              },
            );

            instructions.push(...exprInstructions);
            reducedType = reducedType.ofTailDimensions();

            let offsetAddressVar: CIRInstructionVarArg = null;
            const entryByteSize = reducedType.getByteSize();

            if (isCIRVariable(exprOutput)) {
              const constant = CIRConstant.ofConstant(
                CPrimitiveType.int(config.arch),
                entryByteSize,
              );

              offsetAddressVar = allocAddressVar();
              instructions.push(
                new CIRMathInstruction(
                  TokenType.MUL,
                  exprOutput, constant,
                  offsetAddressVar.name,
                ),
              );
            } else if (exprOutput.constant) {
              offsetAddressVar = CIRConstant.ofConstant(
                CPrimitiveType.int(config.arch),
                exprOutput.constant * entryByteSize,
              );
            }

            if (offsetAddressVar) {
              instructions.push(
                new CIRMathInstruction(
                  TokenType.PLUS,
                  lastIRAddressVar, offsetAddressVar,
                  (lastIRAddressVar = allocAddressVar()).name,
                ),
              );
            }

            return false;
          }
        },
      },

      [ASTCCompilerKind.AssignmentExpression]: {
        enter() {
          return false;
        },
      },
    },
  )(node);

  if (lastIRAddressVar) {
    const outputVar = allocAddressVar();
    instructions.push(
      new CIRLoadInstruction(
        lastIRAddressVar,
        outputVar.name,
      ),
    );

    lastIRAddressVar = outputVar;
  }

  return {
    instructions,
    output: lastIRAddressVar,
  };
}
