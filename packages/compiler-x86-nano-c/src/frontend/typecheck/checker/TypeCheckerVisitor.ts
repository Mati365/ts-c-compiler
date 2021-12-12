import {TreeVisitor} from '@compiler/grammar/tree/TreeVisitor';
import {ASTCCompilerNode} from '../../parser/ast/ASTCCompilerNode';
import {TypeCheckScopeTree} from './TypeCheckScopeTree';

export class TypeCheckerVisitor extends TreeVisitor<ASTCCompilerNode> {
  private globalScope = new TypeCheckScopeTree;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  leave(node: ASTCCompilerNode) {
  }
}
