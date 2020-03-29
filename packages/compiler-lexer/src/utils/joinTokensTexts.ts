import * as R from 'ramda';
import {Token} from '../tokens/Token';

export function joinTokensTexts(separator: string, tokens: Token[]): string {
  return R.pluck('text', tokens).join(separator);
}
