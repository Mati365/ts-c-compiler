import * as R from 'ramda';

import {TokenType} from '@compiler/lexer/shared';
import {
  CPrimitiveType,
  isArrayLikeType,
  isPointerLikeType,
  isStructLikeType,
} from '@compiler/pico-c/frontend/analyze';

import {CUnaryCastOperator} from '@compiler/pico-c/constants';
import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {
  ASTCCastUnaryExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCPostfixArrayExpression,
  ASTCPostfixDotExpression,
  ASTCPostfixExpression,
  ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {
  IRInstruction,
  IRLeaInstruction,
  IRLoadInstruction,
  IRMathInstruction,
} from '../../instructions';

import {
  IRConstant, IRInstructionVarArg,
  IRVariable, isIRVariable,
} from '../../variables';

import {
  IREmitterContextAttrs,
  IREmitterExpressionVarResult,
} from './types';

import {IsOutputInstruction} from '../../interfaces';
import {IRError, IRErrorCode} from '../../errors/IRError';

type LvalueExpressionIREmitAttrs = IREmitterContextAttrs & {
  emitLoadPtr?: boolean;
  node: ASTCCompilerNode;
};

type LvalueExpressionIREmitResult = IREmitterExpressionVarResult & {
  rootIRVar: IRVariable;
};

export function emitIdentifierGetterIR(
  {
    emitLoadPtr = true,
    scope,
    context,
    node,
  }: LvalueExpressionIREmitAttrs,
): LvalueExpressionIREmitResult {
  const {allocator, config, emit} = context;
  let instructions: (IRInstruction & IsOutputInstruction)[] = [];

  let rootIRVar: IRVariable;
  let lastIRVar: IRVariable = null;
  let parentNodes: ASTCPostfixExpression[] = [];

  const getParentType = () => R.last(parentNodes).postfixExpression?.type;

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.PostfixExpression]: {
        enter(expr: ASTCPostfixExpression) {
          parentNodes.push(expr);
        },
        leave() {
          parentNodes.pop();
        },
      },

      [ASTCCompilerKind.BinaryOperator]: {
        enter() {
          throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
        },
      },

      [ASTCCompilerKind.CastUnaryExpression]: {
        enter(expr: ASTCCastUnaryExpression) {
          if (expr.operator !== CUnaryCastOperator.MUL)
            throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);

          const pointerExprResult = emit.expression(
            {
              node: expr.castExpression,
              context,
              scope,
            },
          );

          if (!isIRVariable(pointerExprResult.output))
            throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);

          instructions.push(...pointerExprResult.instructions);
          lastIRVar = pointerExprResult.output;
          return false;
        },
      },

      [ASTCCompilerKind.PrimaryExpression]: {
        enter(expr: ASTCPrimaryExpression) {
          if (!expr.isIdentifier())
            return;

          const name = expr.identifier.text;
          const irVariable = allocator.getVariable(name);

          rootIRVar ??= irVariable;

          /**
           * detect this case:
           *  char array[10] = { 1, 2, 3, 4, 5, 6 };
           *  array[1] = 2;
           *
           * which is transformed into pointer that is pointing
           * not into te stack but somewhere else
           */
          if (irVariable.virtualArrayPtr) {
            lastIRVar = allocator.allocAddressVariable();
            instructions.push(
              new IRLoadInstruction(irVariable, lastIRVar),
            );
          } else if (
            isPointerLikeType(irVariable.type)
              && (isArrayLikeType(irVariable.type.baseType) || isStructLikeType(irVariable.type.baseType))
          ) {
            // emits LEA before array[1][2], struct. like expressions
            lastIRVar = allocator.allocAddressVariable();
            instructions.push(
              new IRLeaInstruction(irVariable, lastIRVar),
            );
          } else {
            lastIRVar = irVariable;
          }
        },
      },

      [ASTCCompilerKind.PostfixDotExpression]: {
        enter(expr: ASTCPostfixDotExpression) {
          if (!lastIRVar)
            return true;

          const parentType = getParentType();
          if (!isStructLikeType(parentType))
            throw new IRError(IRErrorCode.ACCESS_STRUCT_ATTR_IN_NON_STRUCT);

          const offsetConstant = IRConstant.ofConstant(
            CPrimitiveType.int(config.arch),
            parentType.getField(expr.name.text).getOffset(),
          );

          if (offsetConstant.constant) {
            instructions.push(
              new IRMathInstruction(
                TokenType.PLUS,
                lastIRVar,
                offsetConstant,
                lastIRVar = allocator.allocAddressVariable(),
              ),
            );
          }
        },
      },

      [ASTCCompilerKind.PostfixArrayExpression]: {
        enter(expr: ASTCPostfixArrayExpression) {
          if (!lastIRVar)
            return true;

          const parentType = getParentType();
          if (!isArrayLikeType(parentType))
            throw new IRError(IRErrorCode.ACCESS_ARRAY_INDEX_TO_NON_ARRAY);

          const {
            instructions: exprInstructions,
            output: exprOutput,
          } = context.emit.expression(
            {
              type: lastIRVar.type.getSourceType(),
              node: expr,
              context,
              scope,
            },
          );

          instructions.push(...exprInstructions);

          let offsetAddressVar: IRInstructionVarArg = null;
          const entryByteSize = parentType.ofTailDimensions().getByteSize();

          if (isIRVariable(exprOutput)) {
            if (isPointerLikeType(exprOutput.type)) {
              offsetAddressVar = exprOutput;
            } else {
              const constant = IRConstant.ofConstant(
                CPrimitiveType.int(config.arch),
                entryByteSize,
              );

              offsetAddressVar = allocator.allocAddressVariable();
              instructions.push(
                new IRMathInstruction(
                  TokenType.MUL,
                  exprOutput,
                  constant,
                  offsetAddressVar,
                ),
              );
            }
          } else if (exprOutput.constant) {
            offsetAddressVar = IRConstant.ofConstant(
              CPrimitiveType.int(config.arch),
              exprOutput.constant * entryByteSize,
            );
          }

          if (offsetAddressVar) {
            instructions.push(
              new IRMathInstruction(
                TokenType.PLUS,
                lastIRVar,
                offsetAddressVar,
                lastIRVar = allocator.allocAddressVariable(),
              ),
            );
          }

          return false;
        },
      },
    },
  )(node);

  if (emitLoadPtr && lastIRVar && isPointerLikeType(rootIRVar.type)) {
    const outputVar = allocator.allocTmpVariable(rootIRVar.type.baseType);
    instructions.push(
      new IRLeaInstruction(lastIRVar, outputVar),
    );

    return {
      output: outputVar,
      rootIRVar,
      instructions,
    };
  }

  return {
    output: lastIRVar,
    rootIRVar,
    instructions,
  };
}
