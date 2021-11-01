import {TokenType} from '@compiler/lexer/tokens';
import {BinaryOpNode, TreeNode} from '../tree/TreeNode';
import {Grammar} from '../Grammar';

/**
 * Prevents right recursion on same level operaotrs such as 2-2-2-2.
 * Those operators creates tree that is bigger on right
 *
 * @see {@link https://en.wikipedia.org/wiki/Left_recursion}
 *
 * @export
 * @template G
 * @template T
 * @template O
 * @param {G} g
 * @param {O} root
 * @param {TokenType[]} sameLevelTokensTypes
 * @param {(g: G) => T} highProduction
 * @param {(g: G) => T} primProduction
 */
export function eatLeftRecursiveOperators<
  G extends Grammar<any, any>,
  T extends TreeNode,
  O extends BinaryOpNode,
>(
  g: G,
  root: O,
  sameLevelTokensTypes: TokenType[],
  highProduction: (g: G) => T,
  primProduction: (g: G) => T,
) {
  // kill right recursion and make it left
  for (;;) {
    const nextTokenType = g.fetchRelativeToken(0x0, false)?.type;
    if (sameLevelTokensTypes.indexOf(nextTokenType) === -1)
      break;

    const token = g.consume();
    root.left = new (root as any).constructor(root.op, root.left, root.right).getSingleSideIfOnlyOne();
    root.op = token.type;
    root.right = highProduction(g);
  }

  if (root.right)
    root.left = root.clone();

  root.right = primProduction(g);

  return root.getSingleSideIfOnlyOne();
}
