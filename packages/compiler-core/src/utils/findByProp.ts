import { propEq, find, findIndex } from 'ramda';

export function findByProp(keyName: string) {
  return (value: any) =>
    <T>(list: T[]): T =>
      find(propEq(keyName, value) as any, list);
}

export function findIndexByProp(keyName: string) {
  return (value: any) =>
    (list: any[]): number =>
      findIndex(propEq(keyName, value), list);
}

export const findIndexByName = findIndexByProp('name');
export const findIndexById = findIndexByProp('id');

export const findByName = findByProp('name');
export const findById = findByProp('id');
