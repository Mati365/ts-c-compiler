import { walkOverFields } from '@ts-c-compiler/grammar';

import { NodeLocation } from '@ts-c-compiler/grammar';
import { ASTCCompilerKind, ASTCCompilerNode } from './ASTCCompilerNode';
import { ASTCBlockItemsList } from './ASTCBlockItemsList';

@walkOverFields({
  fields: ['list'],
})
export class ASTCCompoundExpressionStmt extends ASTCCompilerNode {
  constructor(loc: NodeLocation, readonly list: ASTCBlockItemsList) {
    super(ASTCCompilerKind.CompoundExpressionStmt, loc);
  }
}
