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
  CIRInstruction, CIRLeaInstruction,
  CIRLoadInstruction, CIRMathInstruction,
} from '../../instructions';

import {
  CIRConstant, CIRInstructionVarArg,
  CIRVariable, isCIRVariable,
} from '../../variables';

import {
  IREmitterContextAttrs,
  IREmitterExpressionVarResult,
} from './types';

import {IsOutputInstruction} from '../../interfaces';
import {CIRError, CIRErrorCode} from '../../errors/CIRError';

type LvalueExpressionIREmitAttrs = IREmitterContextAttrs & {
  emitLoadPtr?: boolean;
  node: ASTCCompilerNode;
};

type LvalueExpressionIREmitResult = IREmitterExpressionVarResult & {
  rootIRVar: CIRVariable;
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
  let instructions: (CIRInstruction & IsOutputInstruction)[] = [];

  let rootIRVar: CIRVariable;
  let lastIRAddressVar: CIRVariable = null;
  let parentNodes: ASTCPostfixExpression[] = [];

  const getParentType = () => R.last(parentNodes).postfixExpression?.type;
  const allocAddressVar = () => allocator.allocTmpVariable(
    CPrimitiveType.int(config.arch),
  );

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>(
    {
      [ASTCCompilerKind.BinaryOperator]: {
        enter() {
          throw new CIRError(CIRErrorCode.INCORRECT_UNARY_EXPR);
        },
      },

      [ASTCCompilerKind.CastUnaryExpression]: {
        enter(expr: ASTCCastUnaryExpression) {
          if (expr.operator !== CUnaryCastOperator.MUL)
            throw new CIRError(CIRErrorCode.INCORRECT_UNARY_EXPR);

          const pointerExprResult = emit.pointerExpression(
            {
              context,
              scope,
              emitLoadPtr: false,
              node: expr,
            },
          );

          if (!isCIRVariable(pointerExprResult.output))
            throw new CIRError(CIRErrorCode.INCORRECT_UNARY_EXPR);

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
            new CIRLeaInstruction(lastIRAddressVar, variable),
          );
        },
      },

      [ASTCCompilerKind.PostfixDotExpression]: {
        enter(expr: ASTCPostfixDotExpression) {
          if (!lastIRAddressVar)
            return true;

          const parentType = getParentType();
          if (!isStructLikeType(parentType))
            throw new CIRError(CIRErrorCode.ACCESS_STRUCT_ATTR_IN_NON_STRUCT);

          const offsetConstant = CIRConstant.ofConstant(
            CPrimitiveType.int(config.arch),
            parentType.getField(expr.name.text).getOffset(),
          );

          if (offsetConstant.constant) {
            instructions.push(
              new CIRMathInstruction(
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
            throw new CIRError(CIRErrorCode.ACCESS_ARRAY_INDEX_TO_NON_ARRAY);

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

          let offsetAddressVar: CIRInstructionVarArg = null;
          const entryByteSize = parentType.ofTailDimensions().getByteSize();

          if (isCIRVariable(exprOutput)) {
            const constant = CIRConstant.ofConstant(
              CPrimitiveType.int(config.arch),
              entryByteSize,
            );

            offsetAddressVar = allocAddressVar();
            instructions.push(
              new CIRMathInstruction(
                TokenType.MUL,
                exprOutput, constant,
                offsetAddressVar,
              ),
            );
          } else if (exprOutput.constant) {
            offsetAddressVar = CIRConstant.ofConstant(
              CPrimitiveType.int(config.arch),
              exprOutput.constant * entryByteSize,
            );
          }

          if (offsetAddressVar) {
            instructions.push(
              new CIRMathInstruction(
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
      new CIRLoadInstruction(lastIRAddressVar, outputVar),
    );

    lastIRAddressVar = outputVar;
  }

  return {
    output: lastIRAddressVar,
    rootIRVar,
    instructions,
  };
}
