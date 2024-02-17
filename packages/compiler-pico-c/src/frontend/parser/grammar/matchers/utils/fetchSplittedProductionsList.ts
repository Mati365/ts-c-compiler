import * as R from 'ramda';

import { SyntaxError } from '@ts-cc/grammar';
import { TokenType } from '@ts-cc/lexer';
import { CGrammar } from '../shared';

type SplittedProductionsListAttrs<T> = {
  g: CGrammar['g'];
  prodFn: () => T;
  splitToken?: TokenType;
  throwIfEmpty?: boolean;
};

export function fetchSplittedProductionsList<T>({
  g,
  prodFn,
  splitToken = TokenType.COMMA,
  throwIfEmpty = true,
}: SplittedProductionsListAttrs<T>): T[] {
  const items: T[] = [];

  do {
    const result = g.try(prodFn);
    if (!result) {
      break;
    }

    items.push(result);

    if (splitToken) {
      const separator = g.match({
        type: splitToken,
        optional: true,
      });

      if (!separator) {
        break;
      }
    }
  } while (true);

  if (throwIfEmpty && R.isEmpty(items)) {
    throw new SyntaxError();
  }

  return items;
}
