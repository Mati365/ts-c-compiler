import * as R from 'ramda';

import {Result, ok, err, tryFold} from '@compiler/core/monads';
import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';

import {CTypeCheckConfig} from '../constants';
import {CType, CPrimitiveType, isEnumLikeType} from '../types';
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
 * @template C
 */
export class CScopeTree<C extends ASTCCompilerNode = ASTCCompilerNode> implements IsWalkableNode {
  private types: Record<string, CType> = {};
  private variables: Record<string, CVariable> = {};
  private compileTimeConstants: Record<string, number> = {};
  private childScopes: CScopeTree[] = [];

  constructor(
    protected _checkerConfig: CTypeCheckConfig,
    protected _parentAST: C = null,
    protected _parentScope: CScopeTree = null,
  ) {}

  get arch() { return this._checkerConfig.arch; }
  get parentAST() { return this._parentAST; }
  get parentScope() { return this._parentScope; }

  getFunctions() {
    return <CFunctionDeclType[]> (
      R
        .values(this.types)
        .filter((type) => type.isFunction())
    );
  }

  setParentScope(parentScope: CScopeTree): this {
    this._parentScope = parentScope;
    return this;
  }

  isGlobal() {
    return R.isNil(this._parentScope);
  }

  /**
   * Used in visitors to travel over all scope children
   *
   * @param {AbstractTreeVisitor} visitor
   * @memberof CScopeTree
   */
  walk(visitor: AbstractTreeVisitor): void {
    const {childScopes} = this;

    R.forEachObjIndexed(
      visitor.visit.bind(visitor),
      childScopes,
    );
  }

  /**
   * Returns types / variables
   *
   * @memberof CScopeTree
   */
  dump() {
    const {types, variables} = this;

    return {
      types,
      variables,
    };
  }

  /**
   * Define numeric constant used in enums
   *
   * @param {string} name
   * @param {number} value
   * @return {Result<void, CTypeCheckError>}
   * @memberof CScopeTree
   */
  defineCompileTimeConstant(name: string, value: number): Result<number, CTypeCheckError> {
    const {compileTimeConstants} = this;

    const constant = this.findCompileTimeConstant(name);
    if (!R.isNil(constant)) {
      return err(
        new CTypeCheckError(
          CTypeCheckErrorCode.REDEFINITION_OF_COMPILE_CONSTANT,
          null,
          {
            name,
          },
        ),
      );
    }

    compileTimeConstants[name] = value;
    return ok(value);
  }

  /**
   * Defines single variable
   *
   * @see
   *  Performs autocast
   *
   * @param {CVariable} variable
   * @return {Result<CVariable, CTypeCheckError>}
   * @memberof CScopeTree
   */
  defineVariable(variable: CVariable): Result<CVariable, CTypeCheckError> {
    const {variables} = this;
    const {name} = variable;

    if (this.findVariable(name, false)) {
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

    const mappedVariable = variable.ofGlobalScope(this.isGlobal());
    variables[name] = mappedVariable;
    return ok(mappedVariable);
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
   * @see
   *  If defined is enum - defines also constant compile time integers
   *
   * @param {string} name
   * @param {CAbstractNamedType} type
   * @return {Result<CType, CTypeCheckError>}
   * @memberof CScopeTree
   */
  defineType(type: CAbstractNamedType): Result<CType, CTypeCheckError> {
    const {types} = this;

    if (type.name && types[type.name]) {
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
    if (type.name)
      types[type.name] = registeredType;

    // define constant time variables
    if (isEnumLikeType(registeredType)) {
      registeredType.getFieldsList().forEach(([name, value]) => {
        this.defineCompileTimeConstant(name, value);
      });
    }

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
   * Finds constant that are defined by enums during compile time
   *
   * @param {string} name
   * @param {boolean} [findInParent=true]
   * @return {number}
   * @memberof CScopeTree
   */
  findCompileTimeConstant(name: string, findInParent: boolean = true): number {
    const {compileTimeConstants, parentScope} = this;

    const constant = compileTimeConstants[name];
    if (!R.isNil(constant))
      return constant;

    if (parentScope && findInParent)
      return parentScope.findCompileTimeConstant(name);

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
   * If found compile time constant - returns integer
   *
   * @param {string} name
   * @return {CType}
   * @memberof CScopeTree
   */
  findCompileTimeConstantType(name: string): CType {
    if (R.isNil(this.findCompileTimeConstant(name)))
      return null;

    return CPrimitiveType.int(this.arch);
  }

  /**
   * Returns function by name
   *
   * @param {string} name
   * @return {CFunctionDeclType}
   * @memberof CScopeTree
   */
  findFunction(name: string): CFunctionDeclType {
    return this.findType<CFunctionDeclType>(
      name,
      {
        function: true,
      },
    );
  }
}
