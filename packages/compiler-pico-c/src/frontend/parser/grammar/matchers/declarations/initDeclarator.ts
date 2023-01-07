import { NodeLocation } from '@compiler/grammar/tree/NodeLocation';
import { TokenType } from '@compiler/lexer/shared';
import {
  ASTCInitDeclarator,
  ASTCInitializer,
} from '@compiler/pico-c/frontend/parser/ast';
import { CGrammar } from '../shared';
import { declarator } from './declarator';
import { initializer } from './initializer';

/**
 * init_declarator
 *  : declarator
 *  | declarator '=' initializer
 *  ;
 */
export function initDeclarator(grammar: CGrammar): ASTCInitDeclarator {
  const { g } = grammar;

  const startLocation = NodeLocation.fromTokenLoc(g.currentToken.loc);
  const declaratorNode = declarator(grammar);

  let initializerNode: ASTCInitializer = null;
  const assignToken = g.match({
    type: TokenType.ASSIGN,
    optional: true,
    consume: false,
  });

  if (assignToken) {
    g.consume();
    initializerNode = initializer(grammar);
  }

  return new ASTCInitDeclarator(startLocation, declaratorNode, initializerNode);
}
