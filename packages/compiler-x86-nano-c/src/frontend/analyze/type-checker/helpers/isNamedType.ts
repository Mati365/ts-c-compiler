import * as R from 'ramda';
import {CType} from '../types/CType';

type CAbstractNamedType = CType & {
  name: string,
};

export function isNamedType(obj: CType): obj is CAbstractNamedType {
  return R.is(String, obj.unwrap()?.name);
}
