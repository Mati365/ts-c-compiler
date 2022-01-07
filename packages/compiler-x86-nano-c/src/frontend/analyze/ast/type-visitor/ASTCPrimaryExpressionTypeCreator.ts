import {TokenType} from '@compiler/lexer/shared';
import {ASTCCompilerKind, ASTCPrimaryExpression} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CQualBitmap} from '../../constants/bitmaps';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {CType, CPrimitiveType, CPointerType} from '../../types';
import {ASTCTypeCreator} from './ASTCTypeCreator';

/**
 * Assigns type to ASTCPrimaryExpression
 *
 * @export
 * @class ASTCPrimaryExpressionTypeCreator
 * @extends {ASTCTypeCreator<ASTCPrimaryExpression>}
 */
export class ASTCPrimaryExpressionTypeCreator extends ASTCTypeCreator<ASTCPrimaryExpression> {
  kind = ASTCCompilerKind.PrimaryExpression;

  override enter(node: ASTCPrimaryExpression): void {
    const {arch, scope} = this;
    let type: CType = null;

    if (node.isConstant()) {
      const {constant} = node;

      switch (constant.type) {
        case TokenType.FLOAT_NUMBER:
          type = CPrimitiveType.float(arch);
          break;

        case TokenType.NUMBER:
          type = CPrimitiveType.int(arch);
          break;

        default:
          throw new CTypeCheckError(
            CTypeCheckErrorCode.UNKNOWN_CONSTANT_TYPE,
            constant.loc,
            {
              text: constant.text,
            },
          );
      }
    } else if (node.isStringLiteral()) {
      type = CPointerType.ofType(
        arch,
        CPrimitiveType
          .char(arch)
          .ofQualifiers(CQualBitmap.const),
      );
    } else if (node.isCharLiteral())
      type = CPrimitiveType.char(arch);
    else if (node.isIdentifier())
      type = scope.findVariableType(node.identifier.text);

    node.type = type;
  }

  override leave(node: ASTCPrimaryExpression): void {
    if (node.type)
      return;

    if (node.isExpression())
      node.type = node.expression.type;
  }
}
