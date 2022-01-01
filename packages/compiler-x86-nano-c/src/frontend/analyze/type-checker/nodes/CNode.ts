import * as R from 'ramda';

import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {IsPrintable} from '@compiler/core/interfaces';

import {Identity} from '@compiler/core/monads';
import {TreePrintVisitor} from '@compiler/grammar/tree/TreePrintVisitor';
import {ASTCCompilerNode} from '@compiler/x86-nano-c/frontend/parser/ast/ASTCCompilerNode';

export type CNodeDescriptor = {
  ast: ASTCCompilerNode,
};

export function isCNode(obj: any): obj is CNode {
  return R.is(Object, obj) && obj.value?.ast;
}

/**
 * Box for ast type
 *
 * @export
 * @class CNode
 * @extends {Identity<T>}
 * @implements {IsWalkableNode}
 * @implements {IsPrintable}
 * @template T
 */
export class CNode<T extends CNodeDescriptor = CNodeDescriptor>
  extends Identity<T>
  implements IsWalkableNode, IsPrintable {

  get ast() { return this.value.ast; }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  walk(visitor: AbstractTreeVisitor): void {}

  getDisplayName(): string {
    return TreePrintVisitor.serializeToString(this.ast);
  }
}
