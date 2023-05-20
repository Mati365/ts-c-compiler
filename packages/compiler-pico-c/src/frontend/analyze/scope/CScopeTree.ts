import * as R from 'ramda';

import { Result, ok, err, tryFold } from '@compiler/core/monads';
import {
  AbstractTreeVisitor,
  IsWalkableNode,
} from '@compiler/grammar/tree/AbstractTreeVisitor';

import { CTypeCheckConfig } from '../constants';
import { CType, CPrimitiveType, isEnumLikeType } from '../types';
import { CFunctionDeclType } from '../types/function/CFunctionDeclType';
import { CVariable } from './variables/CVariable';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../errors/CTypeCheckError';

import { ASTCCompilerNode } from '../../parser/ast/ASTCCompilerNode';
import { CAbstractNamedType } from '../utils/isNamedType';
import { CTypedef } from './CTypedef';

type TypeFindAttrs = {
  struct?: boolean;
  primitive?: boolean;
  enumerator?: boolean;
  function?: boolean;
  findInParent?: boolean;
};

/**
 * C language context scope
 */
export class CScopeTree<C extends ASTCCompilerNode = ASTCCompilerNode>
  implements IsWalkableNode
{
  private types: Record<string, CType> = {};
  private variables: Record<string, CVariable> = {};
  private typedefs: Record<string, CTypedef> = {};

  private compileTimeConstants: Record<string, number> = {};
  private childScopes: CScopeTree[] = [];

  constructor(
    protected _checkerConfig: CTypeCheckConfig,
    protected _parentAST: C = null,
    protected _parentScope: CScopeTree = null,
  ) {}

  get arch() {
    return this._checkerConfig.arch;
  }

  get parentAST() {
    return this._parentAST;
  }

  get parentScope() {
    return this._parentScope;
  }

  getGlobalVariables(): Record<string, CVariable> {
    return R.pickBy(
      (variable: CVariable) => variable.isGlobal(),
      this.variables,
    );
  }

  getVariables() {
    return this.variables;
  }

  getFunctions() {
    return <CFunctionDeclType[]>(
      R.values(this.types).filter(type => type.isFunction())
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
   */
  walk(visitor: AbstractTreeVisitor): void {
    const { childScopes } = this;

    R.forEachObjIndexed(visitor.visit.bind(visitor), childScopes);
  }

  /**
   * Returns types / variables
   */
  dump() {
    const { types, variables, typedefs } = this;

    return {
      types,
      variables,
      typedefs,
    };
  }

  /**
   * Define numeric constant used in enums
   */
  defineCompileTimeConstant(
    name: string,
    value: number,
  ): Result<number, CTypeCheckError> {
    const { compileTimeConstants } = this;

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

  defineTypedef(def: CTypedef): CTypedef {
    this.typedefs[def.name] = def;
    return def;
  }

  defineTypedefs(defs: CTypedef[]) {
    defs.forEach(this.defineTypedef.bind(this));
  }

  /**
   * Defines single variable
   *
   * @see
   *  Performs auto-cast
   */
  defineVariable(variable: CVariable): Result<CVariable, CTypeCheckError> {
    const { variables } = this;
    const { name } = variable;

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
   */
  defineVariables(
    variables: CVariable[],
  ): Result<CVariable[], CTypeCheckError> {
    return tryFold(variable => this.defineVariable(variable), [], variables);
  }

  /**
   * Defines single type in scope
   *
   * @see
   *  If defined is enum - defines also constant compile time integers
   */
  defineType(type: CAbstractNamedType): Result<CType, CTypeCheckError> {
    const { types } = this;

    if (type.name && types[type.name]) {
      return err(
        new CTypeCheckError(CTypeCheckErrorCode.REDEFINITION_OF_TYPE, null, {
          name: type.name,
        }),
      );
    }

    const registeredType = type.ofRegistered(true);
    if (type.name) {
      types[type.name] = registeredType;
    }

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
   */
  findType<R extends CType = CType>(
    name: string,
    attrs: TypeFindAttrs = {},
  ): R {
    const { types, typedefs, parentScope } = this;
    const {
      findInParent = true,
      function: fn,
      primitive,
      struct,
      enumerator,
    } = attrs;

    const type = types[name] ?? typedefs[name]?.type;
    if (type) {
      if (
        (primitive && !type.isPrimitive()) ||
        (struct && !type.isStruct()) ||
        (enumerator && !type.isEnum()) ||
        (fn && !type.isFunction())
      ) {
        return null;
      }

      return <R>type;
    }

    if (findInParent && parentScope) {
      return parentScope.findType(name, attrs);
    }

    return null;
  }

  /**
   * Finds constant that are defined by enums during compile time
   */
  findCompileTimeConstant(name: string, findInParent: boolean = true): number {
    const { compileTimeConstants, parentScope } = this;

    const constant = compileTimeConstants[name];
    if (!R.isNil(constant)) {
      return constant;
    }

    if (parentScope && findInParent) {
      return parentScope.findCompileTimeConstant(name);
    }

    return null;
  }

  /**
   * Search variable
   */
  findVariable(name: string, findInParent: boolean = true): CVariable {
    const { variables, parentScope } = this;

    const variable = variables[name];
    if (variable) {
      return variable;
    }

    if (parentScope && findInParent) {
      return parentScope.findVariable(name);
    }

    return null;
  }

  findTypedef(name: string): CTypedef {
    return this.typedefs[name] || this.parentScope?.findTypedef(name);
  }

  /**
   * Appends scope to scope childs
   */
  appendScope(scope: CScopeTree): CScopeTree {
    scope.setParentScope(this);
    this.childScopes.push(scope);

    return scope;
  }

  /**
   * Returns variable type by its name
   */
  findVariableType(name: string): CType {
    return this.findVariable(name)?.type;
  }

  /**
   * If found compile time constant - returns integer
   */
  findCompileTimeConstantType(name: string): CType {
    if (R.isNil(this.findCompileTimeConstant(name))) {
      return null;
    }

    return CPrimitiveType.int(this.arch);
  }

  /**
   * Returns function by name
   */
  findFunction(name: string): CFunctionDeclType {
    return this.findType<CFunctionDeclType>(name, {
      function: true,
    });
  }
}
