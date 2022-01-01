import {CTypeCheckConfig} from '../constants';
import {TypeCheckScopeTree} from './scope/TypeCheckScopeTree';

export type TypeCheckerContext = {
  scope: TypeCheckScopeTree,
  config: CTypeCheckConfig,
};
