import {ASTCCompilerKind, ASTCPostfixExpression} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CStructType} from '../../types/struct/CStructType';
import {CFunctionDeclType} from '../../types/function';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {ASTCTypeCreator} from './ASTCTypeCreator';

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
    if (node.isDotExpression() || node.isPtrExpression())
      this.assignStructLikeAccessType(node);
    else if (node.isFnExpression())
      this.assignFunctionCallerTypes(node);
    else if (node.isPrimaryExpression())
      node.type = node.primaryExpression.type;
    else if (node.hasNestedPostfixExpression())
      node.type = node.postfixExpression.type;
  }

  /**
   * Assign type to calls like item.abc
   *
   * @private
   * @param {ASTCPostfixExpression} node
   * @memberof ASTCPostfixExpressionTypeCreator
   */
  private assignStructLikeAccessType(node: ASTCPostfixExpression) {
    const baseType = (node.primaryExpression || node.postfixExpression).type;
    if (!baseType) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNKNOWN_LEFT_DOT_EXPRESSION_TYPE,
        node.loc.start,
      );
    }

    if (!baseType.hasInnerTypeAttributes()) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.PROVIDED_TYPE_DOES_NOT_CONTAIN_PROPERTIES,
        node.loc.start,
        {
          typeName: baseType.getShortestDisplayName(),
        },
      );
    }

    if (baseType.isStruct()) {
      const {text: fieldName} = node.dotExpression.name;
      const field = (<CStructType> baseType).getField(fieldName);

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

    // handle int sum(void) call
    if (fnType.isVoidArgsList() && assignments.length) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.TOO_MANY_ARGS_PASSED_TO_FUNCTION,
        node.loc.start,
        {
          typeName: fnType.getShortestDisplayName(),
        },
      );
    }

    if (assignments.length !== fnType.args.length) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.WRONG_ARGS_COUNT_PASSED_TO_FUNCTION,
        node.loc.start,
        {
          typeName: fnType.getShortestDisplayName(),
          expected: fnType.args.length,
          received: assignments.length,
        },
      );
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

    node.type = fnType.returnType;
  }
}
