import { X86IntRegTree } from '../../constants/regs';

type SetRegAvailabilityAttrs = {
  path?: X86IntRegTree[];
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

  if (path) {
    for (let i = 0; i < path.length; ++i) {
      const currentPath = path[i];

      reduced[reduced.indexOf(currentPath)] = {
        ...currentPath,
        unavailable,
      };

      reduced = currentPath.children;

      if (i === path.length - 1 && reduced?.length) {
        recursiveSetAvailabilityInX86RegMap({
          list: reduced,
          unavailable,
        });
      }
    }
  } else {
    for (const tree of reduced) {
      tree.unavailable = unavailable;

      if (tree.children) {
        tree.children = recursiveSetAvailabilityInX86RegMap({
          list: tree.children,
          unavailable,
        });
      }
    }
  }

  return origin;
}
