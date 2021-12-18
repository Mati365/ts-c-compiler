import * as R from 'ramda';
import {Result, ok, err} from '@compiler/core/monads';
import {CType} from '../types/CType';
import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';

/**
 * C language context scope
 *
 * @export
 * @class TypeCheckScopeTree
 */
export class TypeCheckScopeTree {
  private childs: TypeCheckScopeTree[] = [];
  private types: Record<string, CType> = {};

  constructor(
    public readonly parentContext: TypeCheckScopeTree = null,
  ) {}

  isGlobal() {
    return R.isNil(this.parentContext);
  }

  /**
   * Defines signle type in scope
   *
   * @param {string} name
   * @param {CType} type
   * @return {Result<CType, CTypeCheckError>}
   * @memberof TypeCheckScopeTree
   */
  defineType(name: string, type: CType): Result<CType, CTypeCheckError> {
    const {types} = this;

    if (types[name]) {
      return err(
        new CTypeCheckError(
          CTypeCheckErrorCode.REDEFINITION_OF_TYPE,
          {
            name,
          },
        ),
      );
    }

    types[name] = type;
    return ok(type);
  }

  /**
   * Perform search of type by name
   * if not found search in parent
   *
   * @param {string} name
   * @return {CType}
   * @memberof TypeCheckScopeTree
   */
  findType(name: string): CType {
    const {types, parentContext} = this;

    const type = types[name];
    if (type)
      return type;

    if (parentContext)
      return parentContext.findType(name);

    return null;
  }

  /**
   * Appends new scope to tree
   *
   * @template T
   * @param {(scope: TypeCheckScopeTree) => T} fn
   * @return {T}
   * @memberof TypeCheckScopeTree
   */
  enterScope<T>(fn: (scope: TypeCheckScopeTree) => T): T {
    const {childs} = this;
    const childScope = new TypeCheckScopeTree(this);

    childs.push(childScope);
    const result = fn(childScope);
    childs.pop();

    return result;
  }
}
