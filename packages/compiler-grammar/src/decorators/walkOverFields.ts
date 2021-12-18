import * as R from 'ramda';

import {TreeNode} from '../tree/TreeNode';
import {TreeVisitor} from '../tree/TreeVisitor';

type TreeNodeLikeConstructor = {new(...args: any[]): any};

type WalkOverFieldsParams = {
  fields?: string[],
};

/**
 * Generates walk method for tree node
 *
 * @export
 * @template T
 * @param {WalkOverFieldsParams} {fields}
 * @return {(constructor: T) => T}
 */
export function walkOverFields<T extends TreeNodeLikeConstructor>(
  {
    fields,
  }: WalkOverFieldsParams = {},
): (constructor: T) => any {
  return (constructor: T): T => class extends constructor {
    walk(visitor: TreeVisitor<any>): void {
      super.walk(visitor);

      // iterate over all fields
      fields.forEach(
        (fieldName) => {
          const field = this[fieldName];

          if (R.is(Array, field))
            field.forEach((param: TreeNode) => visitor.visit(param));
          else if (field)
            visitor.visit(field);
        },
      );
    }
  };
}
