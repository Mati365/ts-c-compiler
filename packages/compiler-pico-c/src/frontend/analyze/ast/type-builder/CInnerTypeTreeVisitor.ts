import { GroupTreeVisitor } from '@ts-c-compiler/grammar';
import { ASTCCompilerNode } from '../../../parser/ast/ASTCCompilerNode';
import { CTypeAnalyzeContext } from './CTypeAnalyzeContext';
import type { CTypeAnalyzeVisitor } from './CTypeAnalyzeVisitor';

export abstract class CInnerTypeTreeVisitor<
  P extends GroupTreeVisitor<ASTCCompilerNode> = CTypeAnalyzeVisitor,
  C extends CTypeAnalyzeContext = CTypeAnalyzeContext,
> extends GroupTreeVisitor<ASTCCompilerNode, P, C> {
  get arch() {
    return this.context.config.arch;
  }

  get scope() {
    return this.context.scope;
  }
}
