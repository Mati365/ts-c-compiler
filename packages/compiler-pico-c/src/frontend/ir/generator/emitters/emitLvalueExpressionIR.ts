import * as R from 'ramda';

import {TokenType} from '@compiler/lexer/shared';
import {CPrimitiveType, isArrayLikeType, isStructLikeType} from '@compiler/pico-c/frontend/analyze';
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
  IRInstruction, IRLeaInstruction,
  IRLoadInstruction, IRMathInstruction,
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

export function emitLvalueExpression(
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
  let lastIRAddressVar: IRVariable = null;
  let parentNodes: ASTCPostfixExpression[] = [];

  const getParentType = () => R.last(parentNodes).postfixExpression?.type;
  const allocAddressVar = () => allocator.allocTmpVariable(
    CPrimitiveType.int(config.arch),
  );

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.BinaryOperator]: {
        enter() {
          throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
        },
      },

      [ASTCCompilerKind.CastUnaryExpression]: {
        enter(expr: ASTCCastUnaryExpression) {
          if (expr.operator !== CUnaryCastOperator.MUL)
            throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);

          const pointerExprResult = emit.pointerExpression(
            {
              context,
              scope,
              emitLoadPtr: false,
              node: expr,
            },
          );

          if (!isIRVariable(pointerExprResult.output))
            throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);

          instructions.push(...pointerExprResult.instructions);
          lastIRAddressVar = pointerExprResult.output;
          return false;
        },
      },

      [ASTCCompilerKind.PostfixExpression]: {
        enter(expr: ASTCPostfixExpression) {
          parentNodes.push(expr);
        },
        leave() {
          parentNodes.pop();
        },
      },

      [ASTCCompilerKind.PrimaryExpression]: {
        enter(expr: ASTCPrimaryExpression) {
          if (!expr.isIdentifier())
            return;

          const variable = allocator.getVariable(expr.identifier.text);
          rootIRVar ??= variable;

          lastIRAddressVar = allocAddressVar();
          instructions.push(
            new IRLeaInstruction(lastIRAddressVar, variable),
          );
        },
      },

      [ASTCCompilerKind.PostfixDotExpression]: {
        enter(expr: ASTCPostfixDotExpression) {
          if (!lastIRAddressVar)
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
                lastIRAddressVar, offsetConstant,
                lastIRAddressVar = allocAddressVar(),
              ),
            );
          }
        },
      },

      [ASTCCompilerKind.PostfixArrayExpression]: {
        enter(expr: ASTCPostfixArrayExpression) {
          if (!lastIRAddressVar)
            return true;

          const parentType = getParentType();
          if (!isArrayLikeType(parentType))
            throw new IRError(IRErrorCode.ACCESS_ARRAY_INDEX_TO_NON_ARRAY);

          const {
            instructions: exprInstructions,
            output: exprOutput,
          } = context.emit.expression(
            {
              type: lastIRAddressVar.type,
              node: expr,
              context,
              scope,
            },
          );

          instructions.push(...exprInstructions);

          let offsetAddressVar: IRInstructionVarArg = null;
          const entryByteSize = parentType.ofTailDimensions().getByteSize();

          if (isIRVariable(exprOutput)) {
            const constant = IRConstant.ofConstant(
              CPrimitiveType.int(config.arch),
              entryByteSize,
            );

            offsetAddressVar = allocAddressVar();
            instructions.push(
              new IRMathInstruction(
                TokenType.MUL,
                exprOutput, constant,
                offsetAddressVar,
              ),
            );
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
                lastIRAddressVar, offsetAddressVar,
                lastIRAddressVar = allocAddressVar(),
              ),
            );
          }

          return false;
        },
      },
    },
  )(node);

  if (emitLoadPtr && lastIRAddressVar) {
    const outputVar = allocAddressVar();
    instructions.push(
      new IRLoadInstruction(lastIRAddressVar, outputVar),
    );

    lastIRAddressVar = outputVar;
  }

  return {
    output: lastIRAddressVar,
    rootIRVar,
    instructions,
  };
}
