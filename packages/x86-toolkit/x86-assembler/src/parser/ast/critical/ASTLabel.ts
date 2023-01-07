import * as R from 'ramda';

import { Token, TokenType } from '@compiler/lexer/tokens';
import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';

import { ParserError, ParserErrorCode } from '../../../shared/ParserError';
import { ASTAsmParser, ASTAsmTree } from '../ASTAsmParser';
import { ASTNodeKind } from '../types';
import { KindASTAsmNode } from '../ASTAsmNode';

import { tokenDefSize } from '../def/ASTDef';

/**
 * Detects if tokens starts with dot
 */
export function isLocalLabel(name: string): boolean {
  return !!name && name[0] === '.';
}

/**
 * Searchs in tree for token label full name definition,
 * it does not search for address, only name
 */
export function resolveLocalTokenAbsName(
  tree: ASTAsmTree,
  localName: string,
  astNodeIndex: number = tree.astNodes.length,
): string {
  const { astNodes } = tree;

  for (let i = astNodeIndex - 1; i >= 0; --i) {
    const node = <ASTLabel>astNodes[i];
    if (node.kind === ASTNodeKind.LABEL && !node.local) {
      return node.name + localName;
    }
  }

  return null;
}

/**
 * Label is used to define jumps and other stuff such as variables
 */
export class ASTLabel extends KindASTAsmNode(ASTNodeKind.LABEL) {
  readonly local: boolean;

  constructor(
    readonly localName: string, // .abc:
    readonly name: string, // parent.abc:
    loc: NodeLocation,
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
   * @see
   *  Label auto defines if precceding token is DB/DW etc
   */
  static parse(token: Token, parser: ASTAsmParser, tree: ASTAsmTree): ASTLabel {
    const nextToken = parser.fetchRelativeToken(1, false);
    if (!nextToken || token.type !== TokenType.KEYWORD || token.kind) {
      // it should be plain keyword, not register
      return null;
    }

    const sizeTokenDef =
      nextToken.type === TokenType.KEYWORD && tokenDefSize(nextToken);
    if (!sizeTokenDef && nextToken.type !== TokenType.COLON) {
      return null;
    }

    // consume colon token
    if (nextToken.type === TokenType.COLON) {
      parser.fetchRelativeToken();
    }

    // detect if resolving label starting with .
    const localName: string = token.text;
    let name = null;

    if (isLocalLabel(localName)) {
      name = resolveLocalTokenAbsName(tree, localName);

      if (R.isNil(name)) {
        throw new ParserError(ParserErrorCode.MISSING_PARENT_LABEL, token.loc, {
          label: localName,
        });
      }
    } else {
      name = localName;
    }

    // generate label
    return new ASTLabel(localName, name, NodeLocation.fromTokenLoc(token.loc));
  }
}
