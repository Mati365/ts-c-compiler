import { X86IntRegTree } from '../../constants/regs';

export function recursiveRegMapLookupBySize(
  size: number,
  list: X86IntRegTree[],
): X86IntRegTree[] {
  for (const tree of list) {
    if (!tree.unavailable && tree.size === size) {
      return [tree];
    }

    if (tree.size > size) {
      const result = recursiveRegMapLookupBySize(size, list);

      if (result) {
        return [tree, ...result];
      }
    }
  }

  return null;
}
