import { X86RegName } from '@x86-toolkit/assembler/index';
import { X86IntRegTree } from '../../constants/regs';

type X86RegBySizeLookup = {
  size: number;
};

type X86SpecificRegLookup = {
  reg: X86RegName;
};

export type X86RegLookupQuery = (X86RegBySizeLookup | X86SpecificRegLookup) & {
  withUnavailable?: boolean;
};

export const isX86RegLookup = (
  query: X86RegLookupQuery,
): query is X86SpecificRegLookup => 'reg' in query && !!query.reg;

export function recursiveX86RegMapLookup(
  query: X86RegLookupQuery,
  list: X86IntRegTree[],
): X86IntRegTree[] {
  const hasSize = 'size' in query;
  const hasReg = isX86RegLookup(query);

  for (const tree of list) {
    if (
      (query.withUnavailable || !tree.unavailable) &&
      (!hasSize || tree.size === query.size) &&
      (!hasReg || tree.name === query.reg)
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
