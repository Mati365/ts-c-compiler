import * as R from 'ramda';

export function findByProp(keyName: string) {
  return (value: any) => (list: any[]): number => R.find(
    R.propEq(keyName, value),
    list,
  );
}

export const findByName = findByProp('name');
export const findById = findByProp('id');
