import * as R from 'ramda';

import {CMathOperator, CUnaryCastOperator} from '@compiler/pico-c/constants';
import {CPointerType, CType, isArrayLikeType, isPointerLikeType} from '@compiler/pico-c/frontend/analyze';
import {
  ASTCAssignmentExpression,
  ASTCBinaryOpNode, ASTCCastUnaryExpression,
  ASTCCompilerKind, ASTCCompilerNode,
  ASTCPostfixExpression, ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

import {
  CIRInstruction, CIRLeaInstruction,
  CIRLoadInstruction, CIRMathInstruction,
} from '../../instructions';

import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {CIRConstant, CIRInstructionVarArg} from '../../variables';

import {emitLvalueExpression} from './emitLvalueExpressionIR';
import {
  IRInstructionsOptimizationAttrs,
  optimizeInstructionsList,
  tryEvalBinaryInstruction,
} from '../optimization';

export type ExpressionIREmitAttrs = IREmitterContextAttrs & {
  optimization?: IRInstructionsOptimizationAttrs;
  type: CType;
  node: ASTCCompilerNode;
};

export function emitExpressionIR(
  {
    optimization = {},
    type,
    context,
    node,
    scope,
  }: ExpressionIREmitAttrs,
): IREmitterExpressionResult {
  const {allocator, emit, config} = context;

  const instructions: CIRInstruction[] = [];
  let argsVarsStack: CIRInstructionVarArg[] = [];

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
                  optimization: {
                    enabled: false,
                  },
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
                  optimization: {
                    enabled: false,
                  },
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
              optimization: {
                enabled: false,
              },
            },
          );

          if (!assignResult.output)
            throw new CIRError(CIRErrorCode.UNRESOLVED_ASSIGN_EXPRESSION);

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
              optimization: {
                enabled: false,
              },
            },
          );

          if (!exprResult.output)
            throw new CIRError(CIRErrorCode.UNRESOLVED_IDENTIFIER);

          emitExprResult(exprResult);
          return false;
        },
      },

      [ASTCCompilerKind.PrimaryExpression]: {
        enter(expression: ASTCPrimaryExpression) {
          if (expression.isConstant()) {
            argsVarsStack.push(
              CIRConstant.ofConstant(type, expression.constant.value.number),
            );
          } else if (expression.isIdentifier()) {
            const srcVar = allocator.getVariable(expression.identifier.text);

            if (isArrayLikeType(srcVar.type)) {
              const tmpVar = allocNextVariable(
                CPointerType.ofType(config.arch, srcVar.type),
              );

              instructions.push(
                new CIRLeaInstruction(tmpVar.name, srcVar),
              );
            } else if (isPointerLikeType(srcVar.type)) {
              const tmpVar = allocNextVariable(srcVar.type);

              instructions.push(
                new CIRLoadInstruction(srcVar, tmpVar.name),
              );
            } else {
              const addressVar = allocNextVariable(
                CPointerType.ofType(config.arch, srcVar.type),
              );

              const tmpVar = allocNextVariable(srcVar.type);
              instructions.push(
                new CIRLeaInstruction(addressVar.name, srcVar),
                new CIRLoadInstruction(addressVar, tmpVar.name),
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
              throw new CIRError(CIRErrorCode.UNRESOLVED_IDENTIFIER);

            emitExprResult(exprResult);
          }

          return false;
        },
      },

      [ASTCCompilerKind.BinaryOperator]: {
        leave: (binary: ASTCBinaryOpNode) => {
          const [a, b] = [argsVarsStack.pop(), argsVarsStack.pop()];
          const op = <CMathOperator> binary.op;
          const evalResult = tryEvalBinaryInstruction(
            {
              op,
              a,
              b,
            },
          );

          evalResult.match({
            none() {
              instructions.push(
                new CIRMathInstruction(
                  op,
                  b, a,
                  allocNextVariable().name,
                ),
              );
            },
            some(val) {
              argsVarsStack.push(
                CIRConstant.ofConstant(type, val),
              );
            },
          });
        },
      },
    },
  )(node);

  const lastArgVarStack = R.last(argsVarsStack);
  return {
    output: lastArgVarStack,
    instructions: optimizeInstructionsList(optimization, instructions),
  };
}
