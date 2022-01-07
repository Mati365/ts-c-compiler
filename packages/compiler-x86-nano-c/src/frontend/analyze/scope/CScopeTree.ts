import * as R from 'ramda';

import {Result, ok, err, tryFold} from '@compiler/core/monads';
import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';

import {CType} from '../types/CType';
import {CFunctionDeclType} from '../types/function/CFunctionDeclType';
import {CVariable} from './variables/CVariable';
import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';
import {ASTCCompilerNode} from '../../parser/ast/ASTCCompilerNode';
import {CAbstractNamedType} from '../utils/isNamedType';

type TypeFindAttrs = {
  struct?: boolean,
  primitive?: boolean,
  enumerator?: boolean,
  function?: boolean,
  findInParent?: boolean,
};

/**
 * C language context scope
 *
 * @export
 * @class CScopeTree
 * @implements {IsWalkableNode}
 * @implements {IsInnerScoped}
 */
export class CScopeTree<C extends ASTCCompilerNode = ASTCCompilerNode> implements IsWalkableNode {
  private types: Record<string, CType> = {};
  private variables: Record<string, CVariable> = {};
  private childScopes: CScopeTree[] = [];

  constructor(
    protected _parentAST: C = null,
    protected _parentScope: CScopeTree = null,
  ) {}

  get parentAST() { return this._parentAST; }
  get parentScope() { return this._parentScope; }

  setParentScope(parentScope: CScopeTree): this {
    this._parentScope = parentScope;
    return this;
  }

  isGlobal() {
    return R.isNil(this._parentScope);
  }

  walk(visitor: AbstractTreeVisitor): void {
    const {childScopes} = this;

    R.forEachObjIndexed(
      visitor.visit.bind(visitor),
      childScopes,
    );
  }

  dump() {
    const {types, variables} = this;

    return {
      types,
      variables,
    };
  }

  /**
   * Defines single variable
   *
   * @param {CVariable} variable
   * @return {Result<CVariable, CTypeCheckError>}
   * @memberof CScopeTree
   */
  defineVariable(variable: CVariable): Result<CVariable, CTypeCheckError> {
    const {variables} = this;
    const {name} = variable;

    if (this.findVariable(name)) {
      return err(
        new CTypeCheckError(
          CTypeCheckErrorCode.REDEFINITION_OF_VARIABLE,
          null,
          {
            name,
          },
        ),
      );
    }

    variables[name] = variable.ofGlobalScope(this.isGlobal());
    return ok(variable);
  }

  /**
   * Defines pack of multiple variables
   *
   * @param {CVariable[]} variables
   * @return {Result<CVariable[], CTypeCheckError>}
   * @memberof CScopeTree
   */
  defineVariables(variables: CVariable[]): Result<CVariable[], CTypeCheckError> {
    return tryFold(
      (variable) => this.defineVariable(variable),
      [],
      variables,
    );
  }

  /**
   * Defines signle type in scope
   *
   * @param {string} name
   * @param {CAbstractNamedType} type
   * @return {Result<CType, CTypeCheckError>}
   * @memberof CScopeTree
   */
  defineType(type: CAbstractNamedType): Result<CType, CTypeCheckError> {
    const {types} = this;

    if (types[type.name]) {
      return err(
        new CTypeCheckError(
          CTypeCheckErrorCode.REDEFINITION_OF_TYPE,
          null,
          {
            name: type.name,
          },
        ),
      );
    }

    const registeredType = type.ofRegistered(true);
    types[type.name] = registeredType;

    return ok(registeredType);
  }

  /**
   * Perform search of type by name
   * if not found search in parent
   *
   * @template R
   * @param {string} name
   * @param {TypeFindAttrs} [attrs={}]
   * @return {R}
   * @memberof CScopeTree
   */
  findType<R extends CType = CType>(name: string, attrs: TypeFindAttrs = {}): R {
    const {types, parentScope} = this;
    const {
      findInParent = true,
      function: fn,
      primitive,
      struct,
      enumerator,
    } = attrs;

    const type = types[name];
    if (type) {
      if ((primitive && !type.isPrimitive())
          || (struct && !type.isStruct())
          || (enumerator && !type.isEnum())
          || (fn && !type.isFunction()))
        return null;

      return <R> type;
    }

    if (findInParent && parentScope)
      return parentScope.findType(name, attrs);

    return null;
  }

  /**
   * Search variable
   *
   * @param {string} name
   * @param {boolean} [findInParent=true]
   * @return {CVariable}
   * @memberof CScopeTree
   */
  findVariable(name: string, findInParent: boolean = true): CVariable {
    const {variables, parentScope} = this;

    const variable = variables[name];
    if (variable)
      return variable;

    if (parentScope && findInParent)
      return parentScope.findVariable(name);

    return null;
  }

  /**
   * Appends scope to scope childs
   *
   * @param {CScopeTree} scope
   * @return {CScopeTree}
   * @memberof CScopeTree
   */
  appendScope(scope: CScopeTree): CScopeTree {
    scope.setParentScope(this);
    this.childScopes.push(scope);

    return scope;
  }

  /**
   * Returns variable type by its name
   *
   * @param {string} name
   * @return {CType}
   * @memberof CScopeTree
   */
  findVariableType(name: string): CType {
    return (
      this
        .findVariable(name)
        ?.type
    );
  }

  /**
   * Returns function type
   *
   * @param {string} name
   * @return {CType}
   * @memberof CScopeTree
   */
  findFnReturnType(name: string): CType {
    return (
      this
        .findType<CFunctionDeclType>(name, {function: true})
        ?.returnType
    );
  }
}
