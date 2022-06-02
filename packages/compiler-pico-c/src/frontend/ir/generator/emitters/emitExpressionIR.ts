import * as R from 'ramda';

import {CType} from '@compiler/pico-c/frontend/analyze';
import {
  ASTCBinaryOpNode, ASTCCompilerKind,
  ASTCCompilerNode, ASTCPostfixExpression, ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

import {CIRInstruction, CIRLoadInstruction, CIRMathInstruction} from '../../instructions';
import {CIRMathOperator} from '../../constants';
import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {CIRConstant, CIRInstructionVarArg} from '../../variables';

import {emitExpressionIdentifierAccessorIR} from './emitExpressionIdentifierAccessorIR';
import {
  tryConcatInstructions,
  tryEvalBinaryInstruction,
} from '../optimization';

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
  const {allocator} = context;

  const instructions: CIRInstruction[] = [];
  let argsVarsStack: CIRInstructionVarArg[] = [];

  const allocNextVariable = () => {
    const irVariable = allocator.allocTmpVariable(type);
    argsVarsStack.push(irVariable);
    return irVariable;
  };

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.PostfixExpression]: {
        enter(expression: ASTCPostfixExpression) {
          if (expression.isPrimaryExpression())
            return;

          const exprResult = emitExpressionIdentifierAccessorIR(
            {
              node: expression,
              context,
              scope,
              emitExpressionIR,
            },
          );

          if (!exprResult.output)
            throw new CIRError(CIRErrorCode.UNRESOLVED_IDENTIFIER);

          instructions.push(...exprResult.instructions);
          argsVarsStack.push(exprResult.output);

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
            const tmpVar = allocNextVariable();
            const srcVar = allocator.getVariable(expression.identifier.text);

            instructions.push(new CIRLoadInstruction(srcVar, tmpVar.name));
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

            instructions.push(...exprResult.instructions);
            argsVarsStack.push(exprResult.output);
          }

          return false;
        },
      },

      [ASTCCompilerKind.BinaryOperator]: {
        leave: (binary: ASTCBinaryOpNode) => {
          const [a, b] = [argsVarsStack.pop(), argsVarsStack.pop()];
          const op = <CIRMathOperator> binary.op;
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

  // handle case: int a = b;
  if (argsVarsStack?.length !== 1)
    throw new CIRError(CIRErrorCode.UNABLE_TO_COMPILE_EXPRESSION);

  for (let i = 1; i < instructions.length;) {
    const concatedInstruction = tryConcatInstructions(
      {
        a: instructions[i - 1],
        b: instructions[i],
      },
    );

    if (concatedInstruction.isSome()) {
      instructions[i - 1] = concatedInstruction.unwrap();
      instructions.splice(i, 1);
    } else
      ++i;
  }

  const lastArgVarStack = R.last(argsVarsStack);
  return {
    output: lastArgVarStack,
    instructions,
  };
}
