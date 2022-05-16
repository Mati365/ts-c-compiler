import {ASTCCompilerKind, ASTCBinaryOpNode} from '@compiler/pico-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';

import {checkLeftTypeOverlapping} from '../../checker';

/**
 * Assigns type to ASTCBinaryOpTypeCreator
 *
 * @export
 * @class ASTCBinaryOpTypeCreator
 * @extends {ASTCTypeCreator<ASTCBinaryOpNode>}
 */
export class ASTCBinaryOpTypeCreator extends ASTCTypeCreator<ASTCBinaryOpNode> {
  kind = ASTCCompilerKind.BinaryOperator;

  override leave(node: ASTCBinaryOpNode): void {
    if (node.hasSingleSide())
      return;

    const {left, right} = node;
    if (!checkLeftTypeOverlapping(left.type, right.type)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.OPERATOR_SIDES_TYPES_MISMATCH,
        node.loc.start,
        {
          left: left?.type?.getShortestDisplayName() ?? '<unknown-left-expr-type>',
          right: right?.type?.getShortestDisplayName() ?? '<unknown-right-expr-type>',
        },
      );
    }

    node.type = left.type;
  }
}
