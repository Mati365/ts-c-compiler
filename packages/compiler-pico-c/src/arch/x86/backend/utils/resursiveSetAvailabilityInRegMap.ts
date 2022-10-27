import {X86IntRegTree} from '../../constants/regs';

export function recursiveSetAvailabilityInRegMap(
  path: X86IntRegTree[],
  list: X86IntRegTree[],
): X86IntRegTree[] {
  let reduced: X86IntRegTree[] = list;

  for (const currentPath of path) {
    reduced = [...reduced];
    reduced[reduced.indexOf(currentPath)] = {
      ...currentPath,
      unavailable: true,
    };
    reduced = currentPath.children;
  }

  return reduced;
}
