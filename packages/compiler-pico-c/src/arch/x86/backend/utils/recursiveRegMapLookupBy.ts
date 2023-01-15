import { X86RegName } from '@x86-toolkit/assembler/index';
import { X86IntRegTree } from '../../constants/regs';

type RegLookupQuery = {
  size?: number;
  reg?: X86RegName;
};

export function recursiveRegMapLookupBy(
  query: RegLookupQuery,
  list: X86IntRegTree[],
): X86IntRegTree[] {
  const { size, reg } = query;

  for (const tree of list) {
    if (
      !tree.unavailable &&
      (!size || tree.size === size) &&
      (!reg || tree.name === reg)
    ) {
      return [tree];
    }

    if (!size || tree.size > size) {
      const result = recursiveRegMapLookupBy(query, list);

      if (result) {
        return [tree, ...result];
      }
    }
  }

  return null;
}
