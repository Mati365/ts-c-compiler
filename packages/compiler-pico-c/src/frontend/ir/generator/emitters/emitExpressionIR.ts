import * as R from 'ramda';

import {
  ASTCBinaryOpNode, ASTCCompilerKind,
  ASTCCompilerNode, ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {IREmitterContextAttrs} from './types';

import {CIRInstruction, CIRMathInstruction} from '../../instructions';
import {CIRMathOperator} from '../../constants';
import {CIRConstant, CIRInstructionVarArg, CIRVariable, isCIRVariable} from '../../variables';

import {
  tryConcatInstructions,
  tryEvalBinaryInstruction,

} from '../optimization';

type ExpressionIREmitResult = {
  outputVar: CIRVariable;
  instructions: CIRInstruction[];
};

type ExpressionIREmitAttrs = IREmitterContextAttrs & {
  parentVar: CIRVariable;
  node: ASTCCompilerNode;
};

export function emitExpressionIR(
  {
    parentVar,
    context,
    node,
  }: ExpressionIREmitAttrs,
): ExpressionIREmitResult {
  const {allocator} = context;
  const {type} = parentVar;

  const getCurrentVariable = () => allocator.getVariable(parentVar.prefix);

  const instructions: CIRInstruction[] = [];
  let argsVarsStack: CIRInstructionVarArg[] = [getCurrentVariable()];

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
      [ASTCCompilerKind.PrimaryExpression]: {
        enter(expression: ASTCPrimaryExpression) {
          if (expression.isConstant()) {
            argsVarsStack.push(
              CIRConstant.ofConstant(type, expression.constant.value.number),
            );
          } else if (expression.isIdentifier()) {
            argsVarsStack.push(
              allocator.getVariable(expression.identifier.text),
            );
          }
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

  return {
    outputVar: getCurrentVariable(),
    instructions,
  };
}
