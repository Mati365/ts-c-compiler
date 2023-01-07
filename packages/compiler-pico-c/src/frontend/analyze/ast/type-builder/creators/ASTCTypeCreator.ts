import {ASTCCompilerNode, ASTCCompilerKind} from '@compiler/pico-c/frontend/parser/ast';
import {InlineTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';

import type {CTypeAnalyzeVisitor} from '../CTypeAnalyzeVisitor';

export abstract class ASTCTypeCreator<T extends ASTCCompilerNode = ASTCCompilerNode> implements InlineTreeVisitor<T> {
  constructor(
    protected analyzeVisitor: CTypeAnalyzeVisitor,
  ) {}

  get context() { return this.analyzeVisitor.context; }
  get scope() { return this.analyzeVisitor.scope; }
  get arch() { return this.analyzeVisitor.arch; }

  abstract readonly kind: ASTCCompilerKind;

  enter?(node: T): void | boolean;
  leave?(node: T): void;
}

export type NewableASTCTypeCreator = {
  new(...args: ConstructorParameters<typeof ASTCTypeCreator>): ASTCTypeCreator,
};
