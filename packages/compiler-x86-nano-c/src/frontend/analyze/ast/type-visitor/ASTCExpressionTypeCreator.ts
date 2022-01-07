import * as R from 'ramda';

import {ASTCCompilerKind, ASTCExpression} from '@compiler/x86-nano-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';

/**
 * Assigns type to ASTCExpression
 *
 * @export
 * @class ASTCExpressionTypeCreator
 * @extends {ASTCTypeCreator<ASTCExpression>}
 */
export class ASTCExpressionTypeCreator extends ASTCTypeCreator<ASTCExpression> {
  kind = ASTCCompilerKind.Expression;

  override leave(node: ASTCExpression): void {
    node.type ??= R.last(node.assignments)?.type;
  }
}
