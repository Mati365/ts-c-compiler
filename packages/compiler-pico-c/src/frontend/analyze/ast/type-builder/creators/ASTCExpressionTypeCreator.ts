import * as R from 'ramda';

import {
  ASTCCompilerKind,
  ASTCExpression,
} from '@compiler/pico-c/frontend/parser/ast';
import { ASTCTypeCreator } from './ASTCTypeCreator';

export class ASTCExpressionTypeCreator extends ASTCTypeCreator<ASTCExpression> {
  kind = ASTCCompilerKind.Expression;

  override leave(node: ASTCExpression): void {
    node.type ??= R.last(node.assignments)?.type;
  }
}
