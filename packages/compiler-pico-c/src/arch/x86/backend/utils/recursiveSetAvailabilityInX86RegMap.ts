import { X86IntRegTree } from '../../constants/regs';

type SetRegAvailabilityAttrs = {
  path: X86IntRegTree[];
  unavailable: boolean;
  list: X86IntRegTree[];
};

export function recursiveSetAvailabilityInX86RegMap({
  path,
  unavailable,
  list,
}: SetRegAvailabilityAttrs): X86IntRegTree[] {
  const origin: X86IntRegTree[] = [...list];
  let reduced: X86IntRegTree[] = origin;

  for (const currentPath of path) {
    reduced[reduced.indexOf(currentPath)] = {
      ...currentPath,
      unavailable,
    };

    reduced = currentPath.children;
  }

  return origin;
}
