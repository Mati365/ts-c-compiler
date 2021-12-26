import * as R from 'ramda';
import chalk from 'chalk';

import {Result, ok, err, tryFold} from '@compiler/core/monads';
import {CType} from './types/CType';
import {CVariable} from './variables/CVariable';
import {CTypeCheckError, CTypeCheckErrorCode} from '../errors/CTypeCheckError';

/**
 * C language context scope
 *
 * @export
 * @class TypeCheckScopeTree
 */
export class TypeCheckScopeTree {
  private types: Record<string, CType> = {};
  private variables: Record<string, CVariable> = {};
  private childs: TypeCheckScopeTree[] = [];

  constructor(
    public readonly parentContext: TypeCheckScopeTree = null,
  ) {}

  isGlobal() {
    return R.isNil(this.parentContext);
  }

  /**
   * Defines single variable
   *
   * @param {CVariable} variable
   * @return {Result<CVariable, CTypeCheckError>}
   * @memberof TypeCheckScopeTree
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
   * @memberof TypeCheckScopeTree
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
   * @param {boolean} [findInParent=true]
   * @return {CType}
   * @memberof TypeCheckScopeTree
   */
  findType(name: string, findInParent: boolean = true): CType {
    const {types, parentContext} = this;

    const type = types[name];
    if (type)
      return type;

    if (findInParent && parentContext)
      return parentContext.findType(name, findInParent);

    return null;
  }

  /**
   * Search variable
   *
   * @param {string} name
   * @return {CVariable}
   * @memberof TypeCheckScopeTree
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

  /**
   * Prints whole tree to console
   *
   * @param {number} [nesting=0]
   * @returns {string}
   * @memberof TypeCheckScopeTree
   */
  serializeToString(nesting: number = 0): string {
    const {childs, types, variables} = this;
    let lines: string[] = [];

    if (!R.isEmpty(types)) {
      lines = [
        ...lines,
        chalk.bold.white('+ Types:'),
        ...(
          R
            .toPairs(types)
            .flatMap(([name, type]) => {
              const typeLines = (
                type
                  .getDisplayName()
                  .split('\n')
                  .map((str) => chalk.yellowBright(str))
              );

              const prefix = `  + ${name}: `;
              return [
                `${chalk.bold.green(prefix)}${typeLines[0]}`,
                ...(
                  R
                    .tail(typeLines)
                    .map(R.concat(' '.padStart(prefix.length)))
                ),
              ];
            })
        ),
      ];
    }

    if (!R.isEmpty(variables)) {
      lines = [
        ...lines,
        chalk.bold.white('+ Variables:'),
        ...(
          R
            .values(variables)
            .map((variable) => chalk.bold.green(`  + ${variable.getDisplayName()};`))
        ),
      ];
    }

    if (!R.isEmpty(childs)) {
      const scopeLines = [
        chalk.bold.white('Scopes:'),
        ...childs.map((scope) => scope.serializeToString(nesting + 1)),
      ];

      lines = [
        ...lines,
        ...scopeLines.map(R.concat('  ')),
      ];
    }

    return (
      lines
        .map((line) => `${' '.padStart(nesting * 2, ' ')}${line}`)
        .join('\n')
    );
  }
}
