import * as R from 'ramda';

import {TokenType} from '@compiler/lexer/shared';
import {CMathOperator, CUnaryCastOperator} from '@compiler/pico-c/constants';
import {
  CPointerType, CPrimitiveType, CType,
  isArrayLikeType, isPointerLikeType,
} from '@compiler/pico-c/frontend/analyze';

import {
  ASTCAssignmentExpression,
  ASTCBinaryOpNode, ASTCCastUnaryExpression,
  ASTCCompilerKind, ASTCCompilerNode,
  ASTCPostfixExpression, ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

import {
  IRInstruction, IRLeaInstruction,
  IRLoadInstruction, IRMathInstruction,
} from '../../instructions';

import {IRError, IRErrorCode} from '../../errors/IRError';
import {IRConstant, IRInstructionVarArg, IRVariable} from '../../variables';

import {emitLvalueExpression} from './emitLvalueExpressionIR';

export type ExpressionIREmitAttrs = IREmitterContextAttrs & {
  type: CType;
  node: ASTCCompilerNode;
};

export function emitExpressionIR(
  {
    type,
    context,
    node,
    scope,
  }: ExpressionIREmitAttrs,
): IREmitterExpressionResult {
  const {allocator, emit, config} = context;

  const instructions: IRInstruction[] = [];
  let argsVarsStack: IRInstructionVarArg[] = [];

  const allocNextVariable = (nextType: CType = type) => {
    const irVariable = allocator.allocTmpVariable(nextType);
    argsVarsStack.push(irVariable);
    return irVariable;
  };

  const emitExprResult = (result: IREmitterExpressionResult) => {
    instructions.push(...result.instructions);
    argsVarsStack.push(result.output);
  };

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.CastUnaryExpression]: {
        enter(expr: ASTCCastUnaryExpression) {
          switch (expr.operator) {
            case CUnaryCastOperator.MUL: {
              const pointerExprResult = emit.pointerExpression(
                {
                  context,
                  scope,
                  node: expr,
                },
              );

              emitExprResult(pointerExprResult);
              return false;
            }

            case CUnaryCastOperator.AND: {
              const pointerAddresExprResult = emit.pointerAddressExpression(
                {
                  context,
                  scope,
                  node: expr,
                },
              );

              emitExprResult(pointerAddresExprResult);
              return false;
            }
          }
        },
      },

      [ASTCCompilerKind.AssignmentExpression]: {
        enter(expression: ASTCAssignmentExpression) {
          if (!expression.isOperatorExpression())
            return;

          const assignResult = emit.assignment(
            {
              node: expression,
              context,
              scope,
            },
          );

          if (!assignResult.output)
            throw new IRError(IRErrorCode.UNRESOLVED_ASSIGN_EXPRESSION);

          emitExprResult(assignResult);
          return false;
        },
      },

      [ASTCCompilerKind.PostfixExpression]: {
        enter(expression: ASTCPostfixExpression) {
          if (expression.isPrimaryExpression())
            return;

          const exprResult = emitLvalueExpression(
            {
              node: expression,
              context,
              scope,
            },
          );

          if (!exprResult.output)
            throw new IRError(IRErrorCode.UNRESOLVED_IDENTIFIER);

          emitExprResult(exprResult);
          return false;
        },
      },

      [ASTCCompilerKind.PrimaryExpression]: {
        enter(expression: ASTCPrimaryExpression) {
          if (expression.isConstant()) {
            argsVarsStack.push(
              IRConstant.ofConstant(type, expression.constant.value.number),
            );
          } else if (expression.isIdentifier()) {
            const srcVar = allocator.getVariable(expression.identifier.text);

            if (isArrayLikeType(srcVar.type)) {
              const tmpVar = allocNextVariable(
                CPointerType.ofType(config.arch, srcVar.type),
              );

              instructions.push(
                new IRLeaInstruction(srcVar, tmpVar),
              );
            } else if (isPointerLikeType(srcVar.type)) {
              const tmpVar = allocNextVariable(srcVar.type);

              instructions.push(
                new IRLoadInstruction(srcVar, tmpVar),
              );
            } else {
              const addressVar = allocNextVariable(srcVar.type);

              instructions.push(
                new IRLoadInstruction(srcVar, addressVar),
              );
            }
          } else if (expression.isExpression()) {
            const exprResult = emitExpressionIR(
              {
                node: expression.expression,
                type,
                context,
                scope,
              },
            );

            if (!exprResult.output)
              throw new IRError(IRErrorCode.UNRESOLVED_IDENTIFIER);

            emitExprResult(exprResult);
          }

          return false;
        },
      },

      [ASTCCompilerKind.BinaryOperator]: {
        leave: (binary: ASTCBinaryOpNode) => {
          let [a, b] = [argsVarsStack.pop(), argsVarsStack.pop()];
          let output: IRVariable = null;

          if (isPointerLikeType(a.type)) {
            const mulPtrInstruction = new IRMathInstruction(
              TokenType.MUL,
              b,
              IRConstant.ofConstant(
                CPrimitiveType.int(config.arch),
                a.type.getSourceType().getByteSize(),
              ),
              b = allocNextVariable(),
            );

            instructions.push(mulPtrInstruction);
            output = allocNextVariable(a.type);
          }

          if (isPointerLikeType(b.type)) {
            const mulPtrInstruction = new IRMathInstruction(
              TokenType.MUL,
              a,
              IRConstant.ofConstant(
                CPrimitiveType.int(config.arch),
                b.type.getSourceType().getByteSize(),
              ),
              a = allocNextVariable(),
            );

            instructions.push(mulPtrInstruction);
            output = allocNextVariable(b.type);
          }

          output ||= allocNextVariable();
          instructions.push(
            new IRMathInstruction(
              <CMathOperator> binary.op,
              b, a,
              output,
            ),
          );
        },
      },
    },
  )(node);

  const lastArgVarStack = R.last(argsVarsStack);
  return {
    output: lastArgVarStack,
    instructions,
  };
}
