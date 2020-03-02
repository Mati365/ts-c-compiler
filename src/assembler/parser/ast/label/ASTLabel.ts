import * as R from 'ramda';

import {ParserErrorCode, ParserError} from '../../../shared/ParserError';
import {ASTParser, ASTTree} from '../ASTParser';
import {ASTNodeKind} from '../types';
import {Token, TokenType} from '../../lexer/tokens';
import {
  ASTNodeLocation,
  KindASTNode,
} from '../ASTNode';

/**
 * Detects if tokens starts with dot
 *
 * @export
 * @param {string} name
 * @returns {boolean}
 */
export function isLocalLabel(name: string): boolean {
  return !!name && name[0] === '.';
}

/**
 * Searchs in tree for token label full name definition,
 * it does not search for address, only name
 *
 * @export
 * @param {ASTTree} tree
 * @param {string} localName
 * @param {number} [astNodeIndex=tree.astNodes.length]
 * @returns {string}
 */
export function resolveLocalTokenAbsName(
  tree: ASTTree,
  localName: string,
  astNodeIndex: number = tree.astNodes.length,
): string {
  const {astNodes} = tree;

  for (let i = astNodeIndex - 1; i >= 0; --i) {
    const node = <ASTLabel> astNodes[i];
    if (node.kind === ASTNodeKind.LABEL && !node.local)
      return node.name + localName;
  }

  return null;
}

/**
 * Label is used to define jumps and other stuff such as variables
 *
 * @export
 * @class ASTLabel
 * @extends {KindASTNode(AST_LABEL)}
 */
export class ASTLabel extends KindASTNode(ASTNodeKind.LABEL) {
  public readonly local: boolean;

  constructor(
    public readonly localName: string, // .abc:
    public readonly name: string, // parent.abc:
    loc: ASTNodeLocation,
  ) {
    super(loc);
    this.local = localName !== name;
  }

  toString(): string {
    return `${this.name}:`;
  }

  /**
   * Checks if previous token is keyword and current token is colon
   *
   * @static
   * @param {Token} token
   * @param {ASTParser} parser
   * @param {ASTTree} tree
   * @returns {ASTLabel}
   * @memberof ASTLabel
   */
  static parse(token: Token, parser: ASTParser, tree: ASTTree): ASTLabel {
    const nextToken = parser.fetchRelativeToken(1, false);
    if (!nextToken
        || token.type !== TokenType.KEYWORD
        || token.kind // it should be plain keyword, not register
        || nextToken.type !== TokenType.COLON)
      return null;

    // consume colon token
    parser.fetchRelativeToken();

    // detect if resolving label starting with .
    const localName: string = token.text;
    let name = null;

    if (isLocalLabel(localName)) {
      name = resolveLocalTokenAbsName(tree, localName);

      if (R.isNil(name))
        throw new ParserError(ParserErrorCode.MISSING_PARENT_LABEL, null, {label: localName});
    } else
      name = localName;

    // generate label
    return new ASTLabel(
      localName,
      name,
      ASTNodeLocation.fromTokenLoc(token.loc),
    );
  }
}
