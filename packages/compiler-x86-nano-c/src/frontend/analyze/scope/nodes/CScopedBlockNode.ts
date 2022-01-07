import * as R from 'ramda';

import {AbstractTreeVisitor} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {CScopeTree} from '../CScopeTree';
import {CNode, CNodeDescriptor} from './CNode';

export type IsInnerScoped<S extends CScopeTree = CScopeTree> = {
  innerScope: S,
};

export type CScopedBlockNodeDescriptor<S extends CScopeTree = CScopeTree> = (
  IsInnerScoped<S>
  & CNodeDescriptor
  & {
    children?: CNode[],
  }
);

export function isInnerScoped(node: any): node is IsInnerScoped {
  return node?.innerScope;
}

/**
 * Node that contains inner syntax nodes
 *
 * @export
 * @class CScopedBlockNode
 * @extends {CNode<D>}
 * @template D
 */
export class CScopedBlockNode<
    S extends CScopeTree = CScopeTree,
    D extends CScopedBlockNodeDescriptor<S> = CScopedBlockNodeDescriptor<S>,
  >
  extends CNode<D> {

  get innerScope() { return this.value.innerScope; }
  get children() { return this.value.children; }

  override walk(visitor: AbstractTreeVisitor): void {
    R.forEach(
      visitor.visit.bind(visitor),
      this.children || [],
    );
  }
}
