import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {ASTCCompilerNode} from '../../../parser/ast/ASTCCompilerNode';
import {TypeCheckerContext} from '../TypeCheckerContext';

export abstract class CTypeTreeVisitor<
    P extends GroupTreeVisitor<ASTCCompilerNode> = GroupTreeVisitor<ASTCCompilerNode>,
    C extends {} = TypeCheckerContext>
  extends GroupTreeVisitor<ASTCCompilerNode, P, C> {
}
