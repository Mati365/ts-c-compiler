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
  private _childs: TypeCheckScopeTree[] = [];
  private _types: Record<string, CType> = {};

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
    const {_types} = this;

    if (_types[name]) {
      return err(
        new CTypeCheckError(
          CTypeCheckErrorCode.REDEFINITION_OF_TYPE,
          {
            name,
          },
        ),
      );
    }

    _types[name] = type;
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
    const {_types, parentContext} = this;

    const type = _types[name];
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
    const {_childs} = this;
    const childScope = new TypeCheckScopeTree(this);

    _childs.push(childScope);
    const result = fn(childScope);
    _childs.pop();

    return result;
  }
}
