import { CPrimitiveType } from 'frontend/analyze/types';
import {
  ASTCCompilerKind,
  ASTCSizeofUnaryExpression,
} from 'frontend/parser/ast';

import { ASTCTypeCreator } from './ASTCTypeCreator';

export class ASTCSizeofUnaryExpressionTypeCreator extends ASTCTypeCreator<ASTCSizeofUnaryExpression> {
  kind = ASTCCompilerKind.SizeofUnaryExpression;

  override leave(node: ASTCSizeofUnaryExpression): boolean {
    node.type = CPrimitiveType.int(this.arch);
    node.extractedType = node.typeName?.type ?? node.unaryExpression?.type;
    return false;
  }
}
