import {ASTCCompilerNode, ASTCCompilerKind} from '@compiler/x86-nano-c/frontend/parser/ast';
import {InlineTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';

import type {CTypeAnalyzeVisitor} from '../CTypeAnalyzeVisitor';

/**
 * Creator that appends type to ASTCNode
 *
 * @export
 * @abstract
 * @class ASTCTypeCreator
 * @template T
 */
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

  findVariableType(name: string) {
    const {scope} = this;

    return (
      scope
        .findVariable(name)
        ?.type
    );
  }

  findFnReturnType(name: string) {
    const {scope} = this;

    return (
      scope
        .findFunction(name)
        ?.returnType
    );
  }
}

export type NewableASTCTypeCreator = {
  new(...args: ConstructorParameters<typeof ASTCTypeCreator>): ASTCTypeCreator,
};
