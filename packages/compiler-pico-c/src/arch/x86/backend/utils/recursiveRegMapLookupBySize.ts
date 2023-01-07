import { Option, some, none } from '@compiler/core/monads';
import { X86IntRegTree } from '../../constants/regs';

export function recursiveRegMapLookupBySize(
  size: number,
  list: X86IntRegTree[],
): Option<X86IntRegTree[]> {
  for (const tree of list) {
    if (!tree.unavailable && tree.size === size) {
      return some([tree]);
    }

    if (tree.size > size) {
      const result = recursiveRegMapLookupBySize(size, list).map(item => [
        tree,
        ...item,
      ]);

      if (result.isSome()) {
        return result;
      }
    }
  }

  return none();
}
