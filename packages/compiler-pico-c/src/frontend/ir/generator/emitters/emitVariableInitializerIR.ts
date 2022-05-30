import * as R from 'ramda';

import {
  ASTCBinaryOpNode, ASTCCompilerKind,
  ASTCCompilerNode, ASTCPrimaryExpression, isCompilerTreeNode,
} from '@compiler/pico-c/frontend/parser';

import {CVariable, isInitializerTreeValue} from '@compiler/pico-c/frontend/analyze';
import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {IREmitterContextAttrs} from './types';

import {CIRError, CIRErrorCode} from '../../errors/CIRError';
import {CIRAllocInstruction, CIRInitInstruction, CIRMathInstruction} from '../../instructions';
import {CIRMathOperator} from '../../constants';
import {CIRConstant, CIRInstructionVarArg} from '../../variables';

import {tryEvalBinaryInstruction} from '../eval/tryEvalBinaryInstruction';

type InitializerIREmitAttrs = IREmitterContextAttrs & {
  variable: CVariable;
};

export function emitVariableInitializerIR(
  {
    context,
    variable,
  }: InitializerIREmitAttrs,
) {
  const {allocator, branchesBuilder} = context;

  const rootIRVariable = allocator.allocVariable(variable);
  const argsVarsStack: CIRInstructionVarArg[] = [rootIRVariable];

  const allocNextVariable = () => {
    const irVariable = allocator.allocVariable(
      allocator
        .getVariable(variable.name)
        .ofIncrementedSuffix(),
    );

    argsVarsStack.push(irVariable);
    return irVariable;
  };

  branchesBuilder.emit(
    CIRAllocInstruction.ofIRVariable(rootIRVariable),
  );

  if (variable.isInitialized()) {
    variable.initializer.fields.forEach((initializer, offset) => {
      if (isInitializerTreeValue(initializer)) {
        throw new CIRError(CIRErrorCode.INCORRECT_INITIALIZER_BLOCK);
      }

      if (isCompilerTreeNode(initializer)) {
        GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
          {
            [ASTCCompilerKind.PrimaryExpression]: {
              enter(expression: ASTCPrimaryExpression) {
                if (expression.isConstant()) {
                  argsVarsStack.push(
                    CIRConstant.ofConstant(rootIRVariable.type, expression.constant.value.number),
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
                    branchesBuilder.emit(
                      new CIRMathInstruction(
                        op,
                        b, a,
                        allocNextVariable().name,
                      ),
                    );
                  },
                  some(val) {
                    argsVarsStack.push(
                      CIRConstant.ofConstant(rootIRVariable.type, val),
                    );
                  },
                });
              },
            },
          },
        )(initializer);
      } else if (R.is(String, initializer)) {
        const argVar = allocator.getVariable(initializer);

        branchesBuilder.emit(
          new CIRInitInstruction(
            argVar,
            rootIRVariable.name,
            offset,
          ),
        );
      } else if (!R.isNil(initializer)) {
        // int abc[3] = { 1, 2, 3}
        // constant literals are of type 1
        const type = variable.initializer.getOffsetExpectedType(offset);

        branchesBuilder.emit(
          new CIRInitInstruction(
            CIRConstant.ofConstant(type, initializer),
            rootIRVariable.name,
            offset,
          ),
        );
      }
    });
  }
}
