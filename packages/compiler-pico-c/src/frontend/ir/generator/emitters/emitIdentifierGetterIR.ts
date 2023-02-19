import * as R from 'ramda';

import { TokenType } from '@compiler/lexer/shared';
import {
  CArrayType,
  CPointerType,
  CPrimitiveType,
  CVariableInitializerTree,
  isArrayLikeType,
  isPointerLikeType,
  isStructLikeType,
} from '@compiler/pico-c/frontend/analyze';

import { CUnaryCastOperator } from '@compiler/pico-c/constants';
import { GroupTreeVisitor } from '@compiler/grammar/tree/TreeGroupedVisitor';
import {
  ASTCCastUnaryExpression,
  ASTCCompilerKind,
  ASTCCompilerNode,
  ASTCPostfixArrayExpression,
  ASTCPostfixDotExpression,
  ASTCPostfixExpression,
  ASTCPostfixPtrExpression,
  ASTCPrimaryExpression,
} from '@compiler/pico-c/frontend/parser';

import {
  IRAllocInstruction,
  IRDefConstInstruction,
  IRLabelOffsetInstruction,
  IRLeaInstruction,
  IRLoadInstruction,
  IRMathInstruction,
  IRStoreInstruction,
} from '../../instructions';

import {
  IRConstant,
  IRInstructionTypedArg,
  IRLabel,
  IRVariable,
  isIRVariable,
} from '../../variables';

import {
  createBlankExprResult,
  IREmitterContextAttrs,
  IREmitterExpressionVarResult,
} from './types';
import { IRError, IRErrorCode } from '../../errors/IRError';

type LvalueExpressionIREmitAttrs = IREmitterContextAttrs & {
  node: ASTCCompilerNode;
  emitValueAtAddress?: boolean;
};

export type LvalueExpressionIREmitResult = IREmitterExpressionVarResult & {
  rootIRVar: IRVariable;
};

export function emitIdentifierGetterIR({
  emitValueAtAddress = true,
  scope,
  context,
  node,
}: LvalueExpressionIREmitAttrs): LvalueExpressionIREmitResult {
  const { allocator, config, emit } = context;
  const { instructions, data } = createBlankExprResult();

  let rootIRVar: IRVariable;
  let lastIRVar: IRVariable = null;
  let parentNodes: ASTCPostfixExpression[] = [];

  const getParentType = () => R.last(parentNodes).postfixExpression?.type;

  GroupTreeVisitor.ofIterator<ASTCCompilerNode>({
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
        if (expr.operator !== CUnaryCastOperator.MUL) {
          throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
        }

        const pointerExprResult = emit.expression({
          node: expr.castExpression,
          context,
          scope,
        });

        if (!isIRVariable(pointerExprResult.output)) {
          throw new IRError(IRErrorCode.INCORRECT_UNARY_EXPR);
        }

        instructions.push(...pointerExprResult.instructions);
        lastIRVar = pointerExprResult.output;
        return false;
      },
    },

    [ASTCCompilerKind.PrimaryExpression]: {
      enter(expr: ASTCPrimaryExpression) {
        if (expr.isStringLiteral()) {
          /**
           * Used in inline string initialization like in:
           *
           *  fn("Hello world!");
           *
           * todo: Check if it even works!
           */
          const arrayPtrType = CPointerType.ofArray(<CArrayType>expr.type);
          const dataType = CArrayType.ofFlattenDescriptor({
            type: expr.type,
            dimensions: [expr.stringLiteral.length],
          });

          lastIRVar = allocator.allocTmpVariable(dataType);

          const constArrayVar = allocator.allocConstDataVariable(dataType);
          const tmpLeaAddressVar = allocator.allocTmpVariable(arrayPtrType);

          data.push(
            new IRDefConstInstruction(
              CVariableInitializerTree.ofStringLiteral({
                baseType: expr.type,
                parentAST: expr,
                text: expr.stringLiteral,
              }),
              constArrayVar,
            ),
          );

          instructions.push(
            IRAllocInstruction.ofDestPtrVariable(lastIRVar),
            new IRLeaInstruction(constArrayVar, tmpLeaAddressVar),
            new IRStoreInstruction(tmpLeaAddressVar, lastIRVar),
          );
        }

        if (expr.isIdentifier()) {
          const name = expr.identifier.text;
          const irFunction = allocator.getFunction(name);

          /**
           * Detect case:
           * int* ptr = fn_name;
           */
          if (irFunction) {
            lastIRVar = allocator.allocTmpVariable(
              CPointerType.ofType(irFunction.type),
            );

            instructions.push(
              new IRLabelOffsetInstruction(
                IRLabel.ofName(irFunction.name),
                lastIRVar,
              ),
            );
          } else {
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
              lastIRVar = allocator.allocAddressVariable(irVariable.type);
              instructions.push(new IRLoadInstruction(irVariable, lastIRVar));
            } else if (
              isPointerLikeType(irVariable.type) &&
              isArrayLikeType(irVariable.type.baseType)
            ) {
              // emits LEA before array[1][2], struct. like expressions
              lastIRVar = allocator.allocAddressVariable(irVariable.type);
              instructions.push(new IRLeaInstruction(irVariable, lastIRVar));
            } else {
              lastIRVar = irVariable;
            }
          }
        }
      },
    },

    [ASTCCompilerKind.PostfixPtrExpression]: {
      enter(expr: ASTCPostfixPtrExpression) {
        if (!lastIRVar) {
          return true;
        }

        const parentType = getParentType();
        if (
          !isPointerLikeType(parentType) ||
          !isStructLikeType(parentType.baseType)
        ) {
          throw new IRError(IRErrorCode.ACCESS_STRUCT_ATTR_IN_NON_STRUCT);
        }

        instructions.push(
          new IRLoadInstruction(
            lastIRVar,
            (lastIRVar = allocator.allocAddressVariable(lastIRVar.type)),
          ),
        );

        const offsetConstant = IRConstant.ofConstant(
          CPrimitiveType.int(config.arch),
          parentType.baseType.getField(expr.name.text).offset,
        );

        if (offsetConstant.constant) {
          instructions.push(
            new IRMathInstruction(
              TokenType.PLUS,
              lastIRVar,
              offsetConstant,
              (lastIRVar = allocator.allocAddressVariable(lastIRVar.type)),
            ),
          );
        }

        return false;
      },
    },

    [ASTCCompilerKind.PostfixDotExpression]: {
      enter(expr: ASTCPostfixDotExpression) {
        if (!lastIRVar) {
          return true;
        }

        const parentType = getParentType();
        if (!isStructLikeType(parentType)) {
          throw new IRError(IRErrorCode.ACCESS_STRUCT_ATTR_IN_NON_STRUCT);
        }

        if (
          isPointerLikeType(lastIRVar.type) &&
          isStructLikeType(lastIRVar.type.baseType) &&
          !lastIRVar.isTemporary()
        ) {
          instructions.push(
            new IRLeaInstruction(
              lastIRVar,
              (lastIRVar = allocator.allocAddressVariable(lastIRVar.type)),
            ),
          );
        }

        const offsetConstant = IRConstant.ofConstant(
          CPrimitiveType.int(config.arch),
          parentType.getField(expr.name.text).offset,
        );

        if (offsetConstant.constant) {
          instructions.push(
            new IRMathInstruction(
              TokenType.PLUS,
              lastIRVar,
              offsetConstant,
              (lastIRVar = allocator.allocAddressVariable(lastIRVar.type)),
            ),
          );
        }

        return false;
      },
    },

    [ASTCCompilerKind.PostfixArrayExpression]: {
      enter(expr: ASTCPostfixArrayExpression) {
        if (!lastIRVar) {
          return true;
        }

        const parentType = getParentType();
        let entryByteSize: number = null;

        if (!lastIRVar.isTemporary()) {
          instructions.push(
            new IRLoadInstruction(
              lastIRVar,
              (lastIRVar = allocator.allocAddressVariable(lastIRVar.type)),
            ),
          );
        }

        if (isArrayLikeType(parentType)) {
          entryByteSize = parentType.ofTailDimensions().getByteSize();
        } else if (isPointerLikeType(parentType)) {
          entryByteSize = parentType.baseType.getByteSize();
        } else {
          throw new IRError(IRErrorCode.ACCESS_ARRAY_INDEX_TO_NON_ARRAY);
        }

        const { instructions: exprInstructions, output: exprOutput } =
          context.emit.expression({
            node: expr,
            context,
            scope,
          });

        instructions.push(...exprInstructions);
        let offsetAddressVar: IRInstructionTypedArg = null;

        if (isIRVariable(exprOutput)) {
          if (isPointerLikeType(exprOutput.type)) {
            offsetAddressVar = exprOutput;
          } else {
            const constant = IRConstant.ofConstant(
              CPrimitiveType.int(config.arch),
              entryByteSize,
            );

            offsetAddressVar = allocator.allocAddressVariable(lastIRVar.type);
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
              (lastIRVar = allocator.allocAddressVariable(lastIRVar.type)),
            ),
          );
        }

        return false;
      },
    },
  })(node);

  if (emitValueAtAddress && lastIRVar && isPointerLikeType(lastIRVar.type)) {
    // handle loading data into identifier IR
    // example: int k = vec.x;
    // last variable is `x` from `vec` but `IR` returned `Vec2*`
    // it has to be auto-casted to `int`
    const outputVar = allocator.allocTmpVariable(
      lastIRVar.type.baseType.isPrimitive()
        ? lastIRVar.type.baseType
        : node.type,
    );

    instructions.push(new IRLoadInstruction(lastIRVar, outputVar));

    return {
      output: outputVar,
      rootIRVar,
      instructions,
    };
  }

  return {
    output: lastIRVar,
    data,
    rootIRVar,
    instructions,
  };
}
