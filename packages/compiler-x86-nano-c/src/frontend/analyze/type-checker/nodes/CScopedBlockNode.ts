import * as R from 'ramda';

import {AbstractTreeVisitor} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {TypeCheckScopeTree} from '../scope/TypeCheckScopeTree';
import {CNode, CNodeDescriptor} from './CNode';

export type IsInnerScoped = {
  innerScope: TypeCheckScopeTree,
};

export type CScopedBlockNodeDescriptor = IsInnerScoped & CNodeDescriptor & {
  children?: CNode[],
};

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
export class CScopedBlockNode<D extends CScopedBlockNodeDescriptor = CScopedBlockNodeDescriptor>
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
