import * as R from 'ramda';

import { isLogicOpToken, isRelationOpToken } from '@ts-cc/lexer';
import { getBaseTypeIfPtr, isImplicitPtrType } from 'frontend/analyze/types/utils';

import { charToInt, tryCastToPointer } from 'frontend/analyze/casts';

import { TokenType } from '@ts-cc/lexer';
import { CMathOperator, CRelOperator, CUnaryCastOperator } from '#constants';
import { hasBuiltinPrefix } from 'builtins/utils/builtinPrefix';

import {
  CPointerType,
  CPrimitiveType,
  CType,
  isPointerArithmeticType,
  isPointerLikeType,
  isPrimitiveLikeType,
  isStructLikeType,
  isUnionLikeType,
} from 'frontend/analyze';

import {
  ASTCAssignmentExpression,
  ASTCBinaryOpNode,
  ASTCCastUnaryExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCConditionalExpression,
  ASTCPostfixExpression,
  ASTCPrimaryExpression,
  ASTCSizeofUnaryExpression,
  ASTCCompoundExpressionStmt,
} from 'frontend/parser';

import { GroupTreeVisitor } from '@ts-cc/grammar';
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
  IRMathSingleArgInstruction,
  IRCastInstruction,
} from '../../../instructions';

import { IRError, IRErrorCode } from '../../../errors/IRError';
import {
  IRConstant,
  IRInstructionTypedArg,
  IRLabel,
  IRVariable,
  isIRConstant,
} from '../../../variables';

import { emitIdentifierGetterIR } from '../emitIdentifierGetterIR';
import { emitIncExpressionIR } from '../emitIncExpressionIR';
import { emitFnCallExpressionIR } from '../emit-fn-call-expression';
import { emitLogicBinaryJmpExpressionIR } from './emitLogicBinaryJmpExpressionIR';
import { emitStringLiteralPtrInitializerIR } from '../emit-initializer/literal';
import { emitConditionalExpressionIR } from './emitConditionalExpressionIR';
import { emitCompoundExpressionIR } from './emitCompoundExpressionStmtIR';

export type ExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
};

export function emitExpressionIR({
  initializerMeta,
  context,
  node,
  scope,
}: ExpressionIREmitAttrs): IREmitterExpressionResult {
  const { allocator, emit, config, globalVariables } = context;
  const { arch } = config;

  const result = createBlankExprResult();
  const { instructions } = result;
  let argsVarsStack: IRInstructionTypedArg[] = [];

  const pushNextVariable = (variable: IRVariable) => {
    argsVarsStack.push(variable);
    return variable;
  };

  const allocNextVariable = (nextType: CType | IRVariable = node.type) =>
    pushNextVariable(allocator.allocTmpVariable(nextType));

  const emitExprResultToStack = (exprResult: IREmitterExpressionResult) => {
    appendStmtResults(exprResult, result);

    if (exprResult.output) {
      argsVarsStack.push(exprResult.output);
    }
  };

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
    [ASTCCompilerKind.SizeofUnaryExpression]: {
      enter(expr: ASTCSizeofUnaryExpression) {
        argsVarsStack.push(
          IRConstant.ofConstant(
            CPrimitiveType.int(arch),
            expr.extractedType.getByteSize(),
          ),
        );

        return false;
      },
    },

    [ASTCCompilerKind.CastUnaryExpression]: {
      enter(expr: ASTCCastUnaryExpression) {
        switch (expr.operator) {
          // !a
          case CUnaryCastOperator.LOGICAL_NOT: {
            emitExprResultToStack(
              emit.expression({
                node: expr.castExpression,
                scope,
                context,
              }),
            );

            instructions.push(
              new IRMathSingleArgInstruction(
                TokenType.NOT,
                argsVarsStack.pop(),
                allocNextVariable(expr.type),
              ),
            );

            return false;
          }

          // ~a
          case CUnaryCastOperator.BITWISE_NOT: {
            emitExprResultToStack(
              emit.expression({
                node: expr.castExpression,
                scope,
                context,
              }),
            );

            instructions.push(
              new IRMathSingleArgInstruction(
                TokenType.BIT_NOT,
                argsVarsStack.pop(),
                allocNextVariable(expr.type),
              ),
            );

            return false;
          }

          // -a
          case CUnaryCastOperator.SUB: {
            emitExprResultToStack(
              emit.expression({
                node: expr.castExpression,
                scope,
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
        if (expression.isPostIncExpression() || expression.isPreIncExpression()) {
          const isPreInc = expression.isPreIncExpression();

          // handle i++ / ++i
          const sign = expression.getIncSign();
          const irSrcVarExprResult = emitIdentifierGetterIR({
            emitValueAtAddress: false,
            node: isPreInc ? expression.primaryExpression : expression.postfixExpression,
            context,
            scope,
          });

          const exprResult = emitIncExpressionIR({
            node,
            pre: isPreInc,
            rootIRVar: irSrcVarExprResult.output,
            context,
            sign,
          });

          instructions.push(...irSrcVarExprResult.instructions);
          emitExprResultToStack(exprResult);
          return false;
        } else if (expression.isFnExpression() || expression.isFnPtrCallExpression()) {
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

    [ASTCCompilerKind.CompoundExpressionStmt]: {
      enter(compound: ASTCCompoundExpressionStmt) {
        const blockStmt = emitCompoundExpressionIR({
          node: compound,
          initializerMeta,
          scope,
          context,
        });

        emitExprResultToStack(blockStmt);
        return false;
      },
    },

    [ASTCCompilerKind.PrimaryExpression]: {
      enter(expression: ASTCPrimaryExpression) {
        if (expression.isStringLiteral()) {
          // handle "hello world" passed as arg to function
          emitExprResultToStack(
            emitStringLiteralPtrInitializerIR({
              context,
              literal: expression.stringLiteral,
            }),
          );
        } else if (expression.isCharLiteral()) {
          // handle 'a'
          argsVarsStack.push(
            IRConstant.ofConstant(expression.type, charToInt(expression.charLiteral)),
          );
        } else if (expression.isConstant()) {
          // handle 2
          argsVarsStack.push(
            IRConstant.ofConstant(expression.type, expression.constant.value.number),
          );
        } else if (expression.isIdentifier()) {
          const { text: name } = expression.identifier;

          if (hasBuiltinPrefix(name)) {
            const srcType = scope.findType(name);
            const tmpVar = allocNextVariable(CPointerType.ofType(srcType));

            instructions.push(new IRLabelOffsetInstruction(IRLabel.ofName(name), tmpVar));

            return false;
          }

          const srcFn = allocator.getFunction(name);
          const srcGlobalVar = globalVariables.getVariable(name);
          const srcVar = allocator.getVariable(name);

          if (srcGlobalVar) {
            const tmpAddressVar = allocNextVariable(srcGlobalVar);

            instructions.push(
              new IRLabelOffsetInstruction(
                IRLabel.ofName(srcGlobalVar.name),
                tmpAddressVar,
              ),
            );

            if (
              !srcGlobalVar.virtualArrayPtr &&
              !getBaseTypeIfPtr(srcGlobalVar.type).isStructOrUnion()
            ) {
              const tmpDestVar = allocNextVariable(getBaseTypeIfPtr(srcGlobalVar.type));

              instructions.push(new IRLoadInstruction(tmpAddressVar, tmpDestVar));
            }
          } else if (srcFn) {
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
            } else if (
              (isStructLikeType(srcVar.type.baseType) ||
                isUnionLikeType(srcVar.type.baseType)) &&
              !srcVar.type.baseType.canBeStoredInReg()
            ) {
              // handle `a = vec` assign where `vec` is structure that
              // does not fits into single reg
              pushNextVariable(srcVar);
            } else {
              // handle normal "a" variable, loads its pointing value
              // basically `a = 2`
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
              IRConstant.ofConstant(scope.findCompileTimeConstantType(name), constant),
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

    [ASTCCompilerKind.ConditionalExpression]: {
      enter: (conditionalExpr: ASTCConditionalExpression) => {
        const exprResult = emitConditionalExpressionIR({
          node: conditionalExpr,
          scope,
          context,
        });

        emitExprResultToStack(exprResult);
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
          const outputs = {
            left: allocNextVariable(binary.left.type),
            right: allocNextVariable(binary.right.type),
            all: allocNextVariable(binary.left.type),
          };

          const phi = new IRPhiInstruction([outputs.left, outputs.right], outputs.all);

          const labels = {
            ifTrueLabel: context.factory.labels.genTmpLabelInstruction().ofPhi(phi),

            ifFalseLabel: context.factory.labels.genTmpLabelInstruction().ofPhi(phi),

            finallyLabel: context.factory.labels.genTmpLabelInstruction().ofPhi(phi),
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

        if (!isPointerArithmeticType(b.type) && isPointerArithmeticType(a.type)) {
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

        if (isPointerArithmeticType(b.type) && !isPointerArithmeticType(a.type)) {
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

        if (
          isPrimitiveLikeType(a.type, true) &&
          isPrimitiveLikeType(b.type, true) &&
          !b.isEqual(a.type as any) &&
          a.type.getByteSize() !== b.type.getByteSize()
        ) {
          if (a.type.getByteSize() < b.type.getByteSize()) {
            if (!isIRConstant(a)) {
              const castedA = allocator.allocTmpVariable(b.type);
              instructions.push(new IRCastInstruction(a, castedA));
              a = castedA;
            }
          } else if (!isIRConstant(b)) {
            const castedB = allocator.allocTmpVariable(a.type);
            instructions.push(new IRCastInstruction(b, castedB));
            b = castedB;
          }
        }

        if (isRelationOpToken(binary.op)) {
          output ||= pushNextVariable(allocator.allocFlagResult());
          instructions.push(new IRICmpInstruction(<CRelOperator>binary.op, b, a, output));
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
