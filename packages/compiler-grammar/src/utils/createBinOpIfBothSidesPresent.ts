import {TreeNode} from '../tree/TreeNode';

export function createBinOpIfBothSidesPresent<O, T, E extends TreeNode>(
  ClassType: new(op: O, left: E, right: E) => T,
  op: O,
  left: E,
  right: E,
): T | E {
  if (left && right)
    return new ClassType(op, left, right);

  if (!left)
    return right;

  return left;
}
