import { TreeNode } from '../tree/TreeNode';

export function createBinOpIfBothSidesPresent<O, T, E extends TreeNode>(
  ClassType: new (_op: O, _left: E, _right: E) => T,
  op: O,
  left: E,
  right: E,
): T | E {
  if (left && right) {
    return new ClassType(op, left, right);
  }

  if (!left) {
    return right;
  }

  return left;
}
