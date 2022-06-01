import * as R from 'ramda';

import {
  ASTCBinaryOpNode, ASTCCompilerKind,
  ASTCCompilerNode, ASTCPostfixExpression, ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {IREmitterContextAttrs, IREmitterExpressionResult} from './types';

import {CIRInstruction, CIRLoadInstruction, CIRMathInstruction} from '../../instructions';
import {CIRMathOperator} from '../../constants';
import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {
  CIRConstant, CIRInstructionVarArg,
  CIRVariable, isCIRVariable,
} from '../../variables';

import {emitExpressionIdentifierAccessorIR} from './emitExpressionIdentifierAccessorIR';
import {
  tryConcatInstructions,
  tryEvalBinaryInstruction,
} from '../optimization';

export type ExpressionIREmitAttrs = IREmitterContextAttrs & {
  parentVar: CIRVariable;
  node: ASTCCompilerNode;
};

export function emitExpressionIR(
  {
    parentVar,
    context,
    node,
    scope,
  }: ExpressionIREmitAttrs,
): IREmitterExpressionResult {
  const {allocator} = context;
  const {type} = parentVar;

  const getCurrentVariable = () => allocator.getVariable(parentVar.prefix);

  const instructions: CIRInstruction[] = [];
  let argsVarsStack: CIRInstructionVarArg[] = [];

  const deallocVariable = () => {
    getCurrentVariable().ofDecrementedSuffix();
  };

  const allocNextVariable = () => {
    const irVariable = allocator.allocVariable(
      getCurrentVariable().ofIncrementedSuffix(),
    );

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
              const newInstruction = new CIRMathInstruction(
                op,
                b, a,
                allocNextVariable().name,
              );

              const concatedInstruction = tryConcatInstructions(
                {
                  a: R.last(instructions),
                  b: newInstruction,
                },
              );

              if (concatedInstruction.isNone())
                instructions.push(newInstruction);
              else {
                deallocVariable();
                argsVarsStack = argsVarsStack.map((arg, index) => {
                  if (isCIRVariable(arg) && index)
                    return arg.ofDecrementedSuffix();

                  return arg;
                });

                instructions.pop();
                instructions.push(concatedInstruction.unwrap());
              }
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
  if (!R.isEmpty(argsVarsStack)) {
    const lastArgVarStack = R.last(argsVarsStack);

    if (argsVarsStack.length !== 1)
      throw new CIRError(CIRErrorCode.UNABLE_TO_COMPILE_EXPRESSION);

    return {
      output: lastArgVarStack,
      instructions,
    };
  }

  return {
    output: getCurrentVariable(),
    instructions,
  };
}
