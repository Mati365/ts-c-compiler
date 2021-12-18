import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {ASTCCompilerNode} from '../../../parser/ast/ASTCCompilerNode';

export abstract class CTypeTreeVisitor<
    P extends GroupTreeVisitor<ASTCCompilerNode> = GroupTreeVisitor<ASTCCompilerNode>,
    C extends {} = any>
  extends GroupTreeVisitor<ASTCCompilerNode, P, C> {
}
