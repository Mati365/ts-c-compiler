import { shallowMemoizeOneCall } from '../utils/memoizeOne';
import { wrapMethod } from './wrapMethod';

export const memoizeMethod = wrapMethod(shallowMemoizeOneCall);
