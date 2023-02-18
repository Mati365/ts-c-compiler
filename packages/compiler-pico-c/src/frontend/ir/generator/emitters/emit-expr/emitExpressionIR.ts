import * as R from 'ramda';

import { isLogicOpToken, isRelationOpToken } from '@compiler/lexer/utils';
import { isImplicitPtrType } from '@compiler/pico-c/frontend/analyze/types/utils';
import {
  charToInt,
  tryCastToPointer,
} from '@compiler/pico-c/frontend/analyze/casts';

import { TokenType } from '@compiler/lexer/shared';
import {
  CMathOperator,
  CRelOperator,
  CUnaryCastOperator,
} from '@compiler/pico-c/constants';
import {
  CPointerType,
  CPrimitiveType,
  CType,
  CVariable,
  CVariableInitializerTree,
  isPointerArithmeticType,
  isPointerLikeType,
} from '@compiler/pico-c/frontend/analyze';

import {
  ASTCAssignmentExpression,
  ASTCBinaryOpNode,
  ASTCCastUnaryExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCPostfixExpression,
  ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import { GroupTreeVisitor } from '@compiler/grammar/tree/TreeGroupedVisitor';
import { getBiggerIRArg } from '../../../utils';
import {
  appendStmtResults,
  createBlankExprResult,
  IREmitterContextAttrs,
  IREmitterExpressionResult,
} from '../types';

import {
  IRICmpInstruction,
  IRJmpInstruction,
  IRLabelOffsetInstruction,
  IRLeaInstruction,
  IRLoadInstruction,
  IRMathInstruction,
  IRPhiInstruction,
  IRAssignInstruction,
} from '../../../instructions';

import { IRError, IRErrorCode } from '../../../errors/IRError';
import {
  IRConstant,
  IRInstructionTypedArg,
  IRLabel,
  IRVariable,
} from '../../../variables';

import { emitIdentifierGetterIR } from '../emitIdentifierGetterIR';
import { emitIncExpressionIR } from '../emitIncExpressionIR';
import { emitFnCallExpressionIR } from '../emit-fn-call-expression';
import { emitLogicBinaryJmpExpressionIR } from './emitLogicBinaryJmpExpressionIR';

export type ExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
};

export function emitExpressionIR({
  initializerMeta,
  context,
  node,
  scope,
}: ExpressionIREmitAttrs): IREmitterExpressionResult {
  const { allocator, emit, config } = context;
  const { arch } = config;

  const result = createBlankExprResult();
  const { instructions } = result;
  let argsVarsStack: IRInstructionTypedArg[] = [];

  const pushNextVariable = (variable: IRVariable) => {
    argsVarsStack.push(variable);
    return variable;
  };

  const allocNextVariable = (nextType: CType = node.type) =>
    pushNextVariable(allocator.allocTmpVariable(nextType));

  const emitExprResultToStack = (exprResult: IREmitterExpressionResult) => {
    appendStmtResults(exprResult, result);

    if (exprResult.output) {
      argsVarsStack.push(exprResult.output);
    }
  };

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
    [ASTCCompilerKind.CastUnaryExpression]: {
      enter(expr: ASTCCastUnaryExpression) {
        // -a
        switch (expr.operator) {
          case CUnaryCastOperator.SUB: {
            emitExprResultToStack(
              emit.expression({
                scope,
                node: expr.castExpression,
                context,
              }),
            );

            instructions.push(
              new IRMathInstruction(
                TokenType.MUL,
                argsVarsStack.pop(),
                IRConstant.ofConstant(CPrimitiveType.int(arch), -1),
                allocNextVariable(expr.type),
              ),
            );

            return false;
          }

          // *a
          case CUnaryCastOperator.MUL: {
            const unaryExprResult = emit.unaryLoadPtrValueIR({
              castExpression: expr.castExpression,
              context,
              scope,
            });

            emitExprResultToStack(unaryExprResult);
            return false;
          }

          // &a
          case CUnaryCastOperator.AND: {
            const pointerAddresExprResult = emit.pointerAddressExpression({
              context,
              scope,
              node: expr,
            });

            emitExprResultToStack(pointerAddresExprResult);
            return false;
          }
        }
      },
    },

    [ASTCCompilerKind.AssignmentExpression]: {
      enter(expression: ASTCAssignmentExpression) {
        if (!expression.isOperatorExpression()) {
          return;
        }

        // a = xyz
        const assignResult = emit.assignment({
          node: expression,
          context,
          scope,
        });

        if (!assignResult.output) {
          throw new IRError(IRErrorCode.UNRESOLVED_ASSIGN_EXPRESSION);
        }

        emitExprResultToStack(assignResult);
        return false;
      },
    },

    [ASTCCompilerKind.PostfixExpression]: {
      enter(expression: ASTCPostfixExpression) {
        if (
          expression.isPostIncExpression() ||
          expression.isPreIncExpression()
        ) {
          const isPreInc = expression.isPreIncExpression();

          // handle i++ / ++i
          const sign = expression.getIncSign();
          const irSrcVarExprResult = emitIdentifierGetterIR({
            emitValueAtAddress: false,
            node: isPreInc
              ? expression.primaryExpression
              : expression.postfixExpression,
            context,
            scope,
          });

          const exprResult = emitIncExpressionIR({
            pre: isPreInc,
            rootIRVar: irSrcVarExprResult.output,
            context,
            sign,
          });

          instructions.push(...irSrcVarExprResult.instructions);
          emitExprResultToStack(exprResult);
          return false;
        } else if (
          expression.isFnExpression() ||
          expression.isFnPtrCallExpression()
        ) {
          // handle a(1, 2)
          const exprResult = emitFnCallExpressionIR({
            node: expression,
            initializerMeta,
            context,
            scope,
          });

          emitExprResultToStack(exprResult);
          return false;
        } else if (!expression.isPrimaryExpression()) {
          // handle (a + 2)
          const exprResult = emitIdentifierGetterIR({
            node: expression,
            context,
            scope,
          });

          if (!exprResult.output) {
            throw new IRError(IRErrorCode.UNRESOLVED_IDENTIFIER);
          }

          emitExprResultToStack(exprResult);
          return false;
        }
      },
    },

    [ASTCCompilerKind.PrimaryExpression]: {
      enter(expression: ASTCPrimaryExpression) {
        if (expression.isStringLiteral()) {
          // handle "hello world" passed as arg to function
          const variable = CVariable.ofAnonymousInitializer(
            CVariableInitializerTree.ofStringLiteral({
              baseType: expression.type,
              parentAST: expression,
              text: expression.stringLiteral,
            }),
          );

          const initializerResult = emit.initializer({
            scope,
            context,
            variable,
          });

          appendStmtResults(initializerResult, result);
          argsVarsStack.push(initializerResult.output);
        } else if (expression.isCharLiteral()) {
          // handle 'a'
          argsVarsStack.push(
            IRConstant.ofConstant(
              expression.type,
              charToInt(expression.charLiteral),
            ),
          );
        } else if (expression.isConstant()) {
          // handle 2
          argsVarsStack.push(
            IRConstant.ofConstant(
              expression.type,
              expression.constant.value.number,
            ),
          );
        } else if (expression.isIdentifier()) {
          const { text: name } = expression.identifier;

          const srcFn = allocator.getFunction(name);
          const srcVar = allocator.getVariable(name);

          if (srcFn) {
            const tmpVar = allocNextVariable(CPointerType.ofType(srcFn.type));

            instructions.push(
              new IRLabelOffsetInstruction(IRLabel.ofName(srcFn.name), tmpVar),
            );
          } else if (srcVar) {
            // handle a[2] / *a
            if (!isPointerLikeType(srcVar.type)) {
              throw new IRError(IRErrorCode.CANNOT_LOAD_PRIMARY_EXPRESSION);
            }

            if (isImplicitPtrType(srcVar.type.baseType)) {
              // handle "array" variable, it is not really pointer
              // so if we treat arrays like pointer ... loads its
              // first element address
              const tmpVar = allocNextVariable(srcVar.type);

              instructions.push(new IRLeaInstruction(srcVar, tmpVar));
            } else {
              // handle normal "ptr" variable, loads its pointing value
              const tmpVar = allocNextVariable(srcVar.type.baseType);
              instructions.push(new IRLoadInstruction(srcVar, tmpVar));
            }
          } else {
            // handle compile time constant like enum { A = 1, B = 2 }
            const constant = scope.findCompileTimeConstant(name);
            if (!constant) {
              throw new IRError(IRErrorCode.CANNOT_LOAD_PRIMARY_EXPRESSION);
            }

            argsVarsStack.push(
              IRConstant.ofConstant(
                scope.findCompileTimeConstantType(name),
                constant,
              ),
            );
          }
        } else if (expression.isExpression()) {
          // handle "2 + (a + 2)"
          const exprResult = emitExpressionIR({
            node: expression.expression,
            context,
            scope,
          });

          if (!exprResult.output && !context.conditionStmt?.labels) {
            throw new IRError(IRErrorCode.UNRESOLVED_IDENTIFIER);
          }

          emitExprResultToStack(exprResult);
        }

        return false;
      },
    },

    [ASTCCompilerKind.BinaryOperator]: {
      enter: (binary: ASTCBinaryOpNode) => {
        // handle logic jmp instructions such like this: a > 2 && b;
        if (!isLogicOpToken(binary.op)) {
          return;
        }

        if (context.conditionStmt) {
          const exprResult = emitLogicBinaryJmpExpressionIR({
            node: binary,
            context,
            scope,
          });

          emitExprResultToStack(exprResult);
          return false;
        } else {
          const labels = {
            ifTrueLabel: context.factory.genTmpLabelInstruction(),
            ifFalseLabel: context.factory.genTmpLabelInstruction(),
            finallyLabel: context.factory.genTmpLabelInstruction(),
          };

          const outputs = {
            left: allocNextVariable(binary.left.type),
            right: allocNextVariable(binary.right.type),
            all: allocNextVariable(binary.left.type),
          };

          const exprResult = emitLogicBinaryJmpExpressionIR({
            node: binary,
            context: {
              ...context,
              conditionStmt: {
                labels,
              },
            },
            scope,
          });

          const phi = new IRPhiInstruction(
            [outputs.left, outputs.right],
            outputs.all,
          );

          emitExprResultToStack(exprResult);

          instructions.push(
            labels.ifTrueLabel,
            new IRAssignInstruction(
              IRConstant.ofConstant(binary.left.type, 1),
              outputs.left,
              {
                phi,
              },
            ),
            new IRJmpInstruction(labels.finallyLabel),
            labels.ifFalseLabel,
            new IRAssignInstruction(
              IRConstant.ofConstant(binary.left.type, 0),
              outputs.right,
              {
                phi,
              },
            ),
            labels.finallyLabel,
            phi,
          );

          return false;
        }
      },

      leave: (binary: ASTCBinaryOpNode) => {
        // handle math instruction such like this: 2 * a
        let [a, b] = [argsVarsStack.pop(), argsVarsStack.pop()];
        let output: IRVariable = null;
        let defaultOutputType = getBiggerIRArg(a, b).type;

        if (
          !isPointerArithmeticType(b.type) &&
          isPointerArithmeticType(a.type)
        ) {
          const mulBy = a.type.getSourceType().getByteSize();

          if (mulBy > 1) {
            const mulPtrInstruction = new IRMathInstruction(
              TokenType.MUL,
              b,
              IRConstant.ofConstant(CPrimitiveType.int(arch), mulBy),
              (b = allocNextVariable()),
            );

            instructions.push(mulPtrInstruction);
            output = allocNextVariable(tryCastToPointer(a.type));
          } else {
            defaultOutputType = a.type;
          }
        }

        if (
          isPointerArithmeticType(b.type) &&
          !isPointerArithmeticType(a.type)
        ) {
          const mulBy = b.type.getSourceType().getByteSize();

          if (mulBy > 1) {
            const mulPtrInstruction = new IRMathInstruction(
              TokenType.MUL,
              a,
              IRConstant.ofConstant(CPrimitiveType.int(arch), mulBy),
              (a = allocNextVariable()),
            );

            instructions.push(mulPtrInstruction);
            output = allocNextVariable(tryCastToPointer(b.type));
          } else {
            defaultOutputType = b.type;
          }
        }

        if (isRelationOpToken(binary.op)) {
          output ||= pushNextVariable(allocator.allocFlagResult());
          instructions.push(
            new IRICmpInstruction(<CRelOperator>binary.op, b, a, output),
          );
        } else {
          output ||= allocNextVariable(defaultOutputType);
          instructions.push(
            new IRMathInstruction(<CMathOperator>binary.op, b, a, output),
          );
        }
      },
    },
  })(node);

  const lastArgVarStack = R.last(argsVarsStack);
  return {
    ...result,
    output: lastArgVarStack,
  };
}
