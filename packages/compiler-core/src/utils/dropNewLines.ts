import * as R from 'ramda';

export function dropNewLines(str: string): string {
  return (str || '').split('\n').map(R.trim).join(' ');
}
