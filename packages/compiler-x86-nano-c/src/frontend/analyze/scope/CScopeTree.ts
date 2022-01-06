import * as R from 'ramda';

import {Result, ok, err, tryFold} from '@compiler/core/monads';
import {CType} from '../types/CType';
import {CVariable} from './variables/CVariable';
import {CFunctionNode} from './nodes/function';
import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';
import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';

import type {IsInnerScoped} from './nodes/CScopedBlockNode';

type TypeFindAttrs = {
  struct?: boolean,
  primitive?: boolean,
  enumerator?: boolean,
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
export class CScopeTree implements IsWalkableNode, IsInnerScoped {
  private types: Record<string, CType> = {};
  private variables: Record<string, CVariable> = {};
  private functions: Record<string, CFunctionNode> = {};

  constructor(
    readonly parentContext: CScopeTree = null,
  ) {}

  get innerScope(): CScopeTree {
    return this;
  }

  isGlobal() {
    return R.isNil(this.parentContext);
  }

  walk(visitor: AbstractTreeVisitor): void {
    const {functions} = this;

    R.forEachObjIndexed(
      visitor.visit.bind(visitor),
      functions,
    );
  }

  dump() {
    const {types, variables, functions} = this;

    return {
      types,
      variables,
      functions,
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

    if (variables[name]) {
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
   * Declares function
   *
   * @param {CFunctionNode} fn
   * @return {Result<CFunctionNode, CTypeCheckError>}
   * @memberof CScopeTree
   */
  defineFunction(fn: CFunctionNode): Result<CFunctionNode, CTypeCheckError> {
    const {functions} = this;
    const {name} = fn;

    if (functions[name]) {
      return err(
        new CTypeCheckError(
          CTypeCheckErrorCode.REDEFINITION_OF_FUNCTION,
          null,
          {
            name,
          },
        ),
      );
    }

    functions[name] = fn;
    return ok(fn);
  }

  /**
   * Defines signle type in scope
   *
   * @param {string} name
   * @param {CType} type
   * @return {Result<CType, CTypeCheckError>}
   * @memberof CScopeTree
   */
  defineType(name: string, type: CType): Result<CType, CTypeCheckError> {
    const {types} = this;

    if (types[name]) {
      return err(
        new CTypeCheckError(
          CTypeCheckErrorCode.REDEFINITION_OF_TYPE,
          null,
          {
            name,
          },
        ),
      );
    }

    const registeredType = type.ofRegistered(true);
    types[name] = registeredType;

    return ok(registeredType);
  }

  /**
   * Perform search of type by name
   * if not found search in parent
   *
   * @param {string} name
   * @param {TypeFindAttrs} [attrs={}]
   * @return {CType}
   * @memberof CScopeTree
   */
  findType(name: string, attrs: TypeFindAttrs = {}): CType {
    const {types, parentContext} = this;
    const {
      findInParent = true,
      primitive,
      struct,
      enumerator,
    } = attrs;

    const type = types[name];
    if (type) {
      if ((primitive && !type.isPrimitive())
          || (struct && !type.isStruct())
          || (enumerator && !type.isEnum()))
        return null;

      return type;
    }

    if (findInParent && parentContext)
      return parentContext.findType(name, attrs);

    return null;
  }

  /**
   * Search variable
   *
   * @param {string} name
   * @return {CVariable}
   * @memberof CScopeTree
   */
  findVariable(name: string): CVariable {
    const {variables, parentContext} = this;

    const variable = variables[name];
    if (variable)
      return variable;

    if (parentContext)
      return parentContext.findVariable(name);

    return null;
  }

  /**
   * Finds function by name
   *
   * @param {string} name
   * @return {CFunctionNode}
   * @memberof CScopeTree
   */
  findFunction(name: string): CFunctionNode {
    const {functions, parentContext} = this;

    const fn = functions[name];
    if (fn)
      return fn;

    if (parentContext)
      return parentContext.findFunction(name);

    return null;
  }

  /**
   * Creates new scope and sets current scope as parent
   *
   * @return {CScopeTree}
   * @memberof CScopeTree
   */
  createChildScope(): CScopeTree {
    return new CScopeTree(this);
  }
}
