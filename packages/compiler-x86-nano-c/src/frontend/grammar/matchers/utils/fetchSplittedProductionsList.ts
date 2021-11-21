import * as R from 'ramda';

import {SyntaxError} from '@compiler/grammar/Grammar';
import {TokenType} from '@compiler/lexer/shared';
import {CGrammar} from '../shared';

export function fetchSplittedProductionsList<T>(
  g: CGrammar['g'],
  prodFn: () => T,
  splitToken: TokenType = TokenType.COMMA,
): T[] {
  const items: T[] = [];

  do {
    items.push(
      prodFn(),
    );

    if (splitToken) {
      const separator = g.match(
        {
          type: splitToken,
          optional: true,
        },
      );

      if (!separator)
        break;
    }
  } while (true);

  if (R.isEmpty(items))
    throw new SyntaxError;

  return items;
}
