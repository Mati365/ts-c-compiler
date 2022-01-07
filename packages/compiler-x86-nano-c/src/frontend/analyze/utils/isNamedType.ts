import * as R from 'ramda';
import type {CType} from '../types/CType';

export type CAbstractNamedType = CType & {
  name: string,
};

export function isNamedType(obj: CType<any>): obj is CAbstractNamedType {
  return R.is(String, obj.unwrap()?.name);
}
