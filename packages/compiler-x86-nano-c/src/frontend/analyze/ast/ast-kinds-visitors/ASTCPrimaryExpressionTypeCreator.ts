import {TokenType} from '@compiler/lexer/shared';
import {ASTCCompilerKind, ASTCPrimaryExpression} from '@compiler/x86-nano-c/frontend/parser/ast';
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
    } else if (node.isIdentifier()) {
      const {text: name} = node.identifier;

      type = (
        scope.findVariableType(name)
          || scope.findFunction(name)
          || scope.findCompileTimeConstantType(name)
      );

      if (!type) {
        throw new CTypeCheckError(
          CTypeCheckErrorCode.UNKNOWN_IDENTIFIER,
          node.loc.start,
          {
            name,
          },
        );
      }
    } else if (node.isStringLiteral())
      type = CPointerType.ofStringLiteral(arch);
    else if (node.isCharLiteral())
      type = CPrimitiveType.char(arch);

    node.type = type;
  }

  override leave(node: ASTCPrimaryExpression): void {
    if (node.type)
      return;

    if (node.isExpression())
      node.type = node.expression.type;
  }
}
