import {GroupTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import {ASTCCompilerNode} from '../../../parser/ast/ASTCCompilerNode';
import {CAnalyzeContext} from '../../CAnalyzeContext';
import type {CAnalyzeVisitor} from '../../CAnalyzeVisitor';

export abstract class CInnerTypeTreeVisitor<
    P extends GroupTreeVisitor<ASTCCompilerNode> = CAnalyzeVisitor,
    C extends  CAnalyzeContext = CAnalyzeContext>
  extends GroupTreeVisitor<ASTCCompilerNode, P, C> {

  get arch() { return this.context.config.arch; }
  get scope() { return this.context.scope; }
}
