import * as R from 'ramda';
import chalk from 'chalk';

import {padLeftLines} from '@compiler/core/utils';

import {TypeCheckScopeTree} from './TypeCheckScopeTree';
import {TypeCheckScopeVisitor, TypedVisitorEntry} from './TypeCheckScopeVisitor';
import {
  isCFunctionNode,
  isInnerScoped,
} from '../nodes';

/**
 * Iterator that walks over tree and prints it
 *
 * @export
 * @class TypeCheckScopePrintVisitor
 * @extends {TypeCheckScopeVisitor}
 */
export class TypeCheckScopePrintVisitor extends TypeCheckScopeVisitor {
  private _reduced: string = '';

  get reduced() { return this._reduced; }

  override enter(entry: TypedVisitorEntry) {
    const {nesting} = this;
    const nodeName = (() => {
      if (isCFunctionNode(entry))
        return entry.getDisplayName();

      return '<anonymous>';
    })();

    const scopeLines = (() => {
      if (!isInnerScoped(entry))
        return [];

      let innerScopeLines = [
        ...this.dumpScopeTree(entry.innerScope).split('\n'),
      ].filter(Boolean);

      if (R.isEmpty(innerScopeLines)) {
        innerScopeLines = [
          chalk.grey('<blank>'),
        ];
      }

      return [
        chalk.bold.white('Scope:'),
        ...padLeftLines(1, innerScopeLines),
        '\n',
      ];
    })();

    const lines = padLeftLines(
      nesting * 2,
      [
        `${chalk.bold.white('Node:')} ${chalk.yellowBright(nodeName)}`,
        ...scopeLines,
      ],
    );

    this._reduced += `${lines.join('\n')}\n`;
  }

  override leave() {
    const {nesting} = this;
    if (nesting === 1)
      this._reduced = this._reduced.replace(/^\s+|\s+$/g, '');
  }

  /**
   * Enters TypeCheckScopeTree object and prints it
   *
   * @private
   * @param {TypeCheckScopeTree} tree
   * @return {string}
   * @memberof TypeCheckScopePrintVisitor
   */
  private dumpScopeTree(tree: TypeCheckScopeTree): string {
    const {types, variables} = tree.dump();
    let lines: string[] = [];

    if (!R.isEmpty(types)) {
      lines = [
        ...lines,
        chalk.white('+ Types:'),
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
        '\n',
      ];
    }

    if (!R.isEmpty(variables)) {
      lines = [
        ...lines,
        chalk.white('+ Variables:'),
        ...(
          R
            .values(variables)
            .map((variable) => chalk.bold.green(`  + ${variable.getDisplayName()};`))
        ),
        '\n',
      ];
    }

    return lines.join('\n');
  }

  /**
   * Print whole scoped tree to string
   *
   * @static
   * @param {TypeCheckScopeTree} scope
   * @return {string}
   * @memberof TypeCheckScopePrintVisitor
   */
  static serializeToString(scope: TypeCheckScopeTree): string {
    return new TypeCheckScopePrintVisitor().visit(scope).reduced;
  }
}
