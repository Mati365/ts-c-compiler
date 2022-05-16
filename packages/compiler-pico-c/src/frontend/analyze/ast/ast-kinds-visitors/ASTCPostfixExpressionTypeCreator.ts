import {ASTCCompilerKind, ASTCPostfixExpression} from '@compiler/pico-c/frontend/parser/ast';
import {CFunctionDeclType} from '../../types/function';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {ASTCTypeCreator} from './ASTCTypeCreator';

import {isArrayLikeType, isPointerLikeType, isStructLikeType} from '../../types';
import {checkLeftTypeOverlapping} from '../../checker';

/**
 * Assigns type to ASTCPostfixExpression
 *
 * @export
 * @class ASTCPostfixExpressionTypeCreator
 * @extends {ASTCTypeCreator<ASTCPostfixExpression>}
 */
export class ASTCPostfixExpressionTypeCreator extends ASTCTypeCreator<ASTCPostfixExpression> {
  kind = ASTCCompilerKind.PostfixExpression;

  override leave(node: ASTCPostfixExpression): void {
    if (node.type)
      return;

    // handle structs / unions members
    if (node.isArrayExpression())
      this.assignArrayLikeAccessType(node);
    else if (node.isDotExpression() || node.isPtrExpression())
      this.assignDotPtrLikeAccessType(node);
    else if (node.isFnExpression())
      this.assignFunctionCallerTypes(node);
    else if (node.isPrimaryExpression())
      node.type = node.primaryExpression.type;
    else if (node.hasNestedPostfixExpression())
      node.type = node.postfixExpression.type;
  }

  /**
   * Assign type to calls like item[0].abc
   *
   * @private
   * @param {ASTCPostfixExpression} node
   * @memberof ASTCPostfixExpressionTypeCreator
   */
  private assignArrayLikeAccessType(node: ASTCPostfixExpression) {
    const {type: baseType} = node.postfixExpression;

    if (isPointerLikeType(baseType)) {
      node.type = baseType.baseType;
    } else if (isArrayLikeType(baseType)) {
      node.type = baseType.ofInitDimensions();
    } else {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.WRONG_NON_ARRAY_FIELD_ACCESS,
        node.loc.start,
        {
          typeName: baseType.getShortestDisplayName(),
        },
      );
    }
  }

  /**
   * Assign type to calls like item.abc or item->abc
   *
   * @private
   * @param {ASTCPostfixExpression} node
   * @memberof ASTCPostfixExpressionTypeCreator
   */
  private assignDotPtrLikeAccessType(node: ASTCPostfixExpression) {
    const baseType = (node.primaryExpression || node.postfixExpression).type;
    if (!baseType) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNKNOWN_LEFT_DOT_EXPRESSION_TYPE,
        node.loc.start,
      );
    }

    if (isStructLikeType(baseType)) {
      if (!baseType.hasInnerTypeAttributes()) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.PROVIDED_TYPE_DOES_NOT_CONTAIN_PROPERTIES,
          node.loc.start,
          {
            typeName: baseType.getShortestDisplayName(),
          },
        );
      }

      const {text: fieldName} = node.dotExpression.name;
      const field = baseType.getField(fieldName);

      if (!field) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.UNKNOWN_STRUCT_LIKE_MEMBER,
          node.loc.start,
          {
            typeName: baseType.getShortestDisplayName(),
            fieldName,
          },
        );
      }

      node.type = field.type;
    } else {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.WRONG_NON_STRUCT_FIELD_ACCESS,
        node.loc.start,
        {
          typeName: baseType.getShortestDisplayName(),
        },
      );
    }
  }

  /**
   * Verify if called function with proper arguments
   *
   * @private
   * @param {ASTCPostfixExpression} node
   * @memberof ASTCPostfixExpressionTypeCreator
   */
  private assignFunctionCallerTypes(node: ASTCPostfixExpression) {
    const {fnExpression} = node;
    const {assignments} = fnExpression.args;
    const fnType = <CFunctionDeclType> node.postfixExpression.type;

    if (!fnType) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNKNOWN_FUNCTION_CALL,
        node.loc.start,
        {
          name: node.getFnName() || '<unknown>',
        },
      );
    }

    if (!fnType.isFunction()) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.CALLED_OBJECT_IS_NOT_FUNCTION,
        node.loc.start,
        {
          typeName: fnType.getShortestDisplayName(),
        },
      );
    }

    const {length: totalFnArgs} = fnType.args;

    if (fnType.isVoidArgsList()) {
      if (assignments.length) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.TOO_MANY_ARGS_PASSED_TO_FUNCTION,
          node.loc.start,
          {
            typeName: fnType.getShortestDisplayName(),
          },
        );
      }
    } else {
      if (totalFnArgs) {
        if (assignments.length > totalFnArgs) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.TOO_MANY_ARGS_PASSED_TO_FUNCTION,
            node.loc.start,
            {
              typeName: fnType.getShortestDisplayName(),
            },
          );
        }

        if (assignments.length !== totalFnArgs) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.WRONG_ARGS_COUNT_PASSED_TO_FUNCTION,
            node.loc.start,
            {
              typeName: fnType.getShortestDisplayName(),
              expected: totalFnArgs,
              received: assignments.length,
            },
          );
        }
      }

      fnType.args.forEach((arg, index) => {
        const [leftType, rightType] = [
          arg.type,
          assignments[index].type,
        ];

        if (!checkLeftTypeOverlapping(leftType, rightType)) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.WRONG_ARG_PASSED_TO_FUNCTION,
            node.loc.start,
            {
              index: index + 1,
              typeName: fnType.getShortestDisplayName(),
              expected: leftType ?? '<unknown-arg-type>',
              received: rightType ?? '<unknown-passed-type>',
            },
          );
        }
      });
    }

    node.type = fnType.returnType;
  }
}
