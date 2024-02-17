import { X86RegName } from '@ts-cc/x86-assembler';
import { X86IntRegTree } from '../../constants/regs';

export type X86RegLookupQuery = {
  allowedRegs?: X86RegName[];
  size?: number;
  withUnavailable?: boolean;
};

export function recursiveX86RegMapLookup(
  query: X86RegLookupQuery,
  list: X86IntRegTree[],
): X86IntRegTree[] {
  const hasSize = 'size' in query && !!query.size;
  const hasReg = 'allowedRegs' in query && !!query.allowedRegs;

  for (const tree of list) {
    if (
      (query.withUnavailable || !tree.unavailable) &&
      (!hasSize || tree.size === query.size) &&
      (!hasReg || query.allowedRegs.includes(tree.name))
    ) {
      return [tree];
    }

    if (!hasSize || tree.size > query.size) {
      const result = recursiveX86RegMapLookup(query, tree.children || []);

      if (result) {
        return [tree, ...result];
      }
    }
  }

  return null;
}
