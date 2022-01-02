import {ASTCCompilerNode, ASTCCompilerKind} from '@compiler/x86-nano-c/frontend/parser/ast';
import {InlineTreeVisitor} from '@compiler/grammar/tree/TreeGroupedVisitor';
import type {CTypeAssignVisitor} from '../CTypeAssignVisitor';

/**
 * Creator that appends type to ASTCNode
 *
 * @see
 *  It modifies ASTCCompilerNode!
 *
 *
 * @export
 * @abstract
 * @class ASTCTypeCreator
 * @template T
 */
export abstract class ASTCTypeCreator<T extends ASTCCompilerNode = ASTCCompilerNode> implements InlineTreeVisitor<T> {
  constructor(
    protected typeVisitor: CTypeAssignVisitor,
  ) {}

  get scope() { return this.typeVisitor.scope; }
  get arch() { return this.typeVisitor.arch; }

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
}

export type NewableASTCTypeCreator = {
  new(...args: ConstructorParameters<typeof ASTCTypeCreator>): ASTCTypeCreator,
};
