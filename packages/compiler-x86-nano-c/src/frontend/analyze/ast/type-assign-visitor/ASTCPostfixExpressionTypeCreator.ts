import {ASTCCompilerKind, ASTCPostfixExpression} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CStructType} from '../../types/struct/CStructType';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {ASTCTypeCreator} from './ASTCTypeCreator';

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
    if (node.isDotExpression() || node.isPtrExpression()) {
      const baseType = (node.primaryExpression || node.postfixExpression).type;
      if (!baseType) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.UNKNOWN_LEFT_DOT_EXPRESSION_TYPE,
          node.loc.start,
        );
      }

      if (!baseType.isStructLike()) {
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
    } else if (node.isPrimaryExpression())
      node.type = node.primaryExpression.type;
    else if (node.hasNestedPostfixExpression())
      node.type = node.postfixExpression.type;
  }
}
