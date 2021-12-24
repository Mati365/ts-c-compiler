import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {ASTCCompilerNode} from '../../../parser/ast/ASTCCompilerNode';
import {TypeCheckerContext} from '../TypeCheckerContext';

export abstract class CTypeTreeVisitor<
    P extends GroupTreeVisitor<ASTCCompilerNode> = GroupTreeVisitor<ASTCCompilerNode>,
    C extends  TypeCheckerContext = TypeCheckerContext>
  extends GroupTreeVisitor<ASTCCompilerNode, P, C> {

  get arch() { return this.context.config.arch; }
  get scope() { return this.context.scope; }
}
