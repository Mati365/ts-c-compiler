import {CTypeCheckConfig} from '../constants';
import {TypeCheckScopeTree} from './TypeCheckScopeTree';

export type TypeCheckerContext = {
  scope: TypeCheckScopeTree,
  config: CTypeCheckConfig,
};
