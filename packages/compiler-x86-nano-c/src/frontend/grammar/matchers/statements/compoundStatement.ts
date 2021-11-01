import * as R from 'ramda';

import {CGrammar} from '../shared';
import {
  ASTCBlockItemsList,
  ASTCCompilerNode,
} from '../../../ast';

import {declaration} from '../declarations/declaration';

function blockItem(grammar: CGrammar): ASTCCompilerNode {
  const {g, statement} = grammar;

  return <ASTCCompilerNode> g.or(
    {
      declaration: () => declaration(grammar),
      statement,
    },
  );
}

function blockItemList(grammar: CGrammar): ASTCBlockItemsList {
  const {g} = grammar;
  const items: ASTCCompilerNode[] = [];

  do {
    const item = g.try(
      () => blockItem(grammar),
    );

    if (!item)
      break;

    items.push(item);
  } while (true);

  if (R.isEmpty(items))
    return null;

  return new ASTCBlockItemsList(items[0].loc, items);
}

/**
 * compound_statement
 *  : '{' '}'
 *  | '{'  block_item_list '}'
 *;
 * @export
 * @param {CGrammar} grammar
 * @return {ASTCBlockItemsList}
 */
export function compoundStatement(grammar: CGrammar): ASTCBlockItemsList {
  const {g} = grammar;

  g.terminal('{');
  const list = blockItemList(grammar);
  g.terminal('}');

  return list;
}
