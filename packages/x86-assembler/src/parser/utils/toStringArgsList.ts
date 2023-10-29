import * as R from 'ramda';

/**
 * Used in string serializers
 */
export function toStringArgsList(prefix: string, args: any[]): string {
  const formattedArgs = R.map(R.toString, args);

  return R.toLower(`${prefix} ${R.join(', ', formattedArgs)}`);
}
