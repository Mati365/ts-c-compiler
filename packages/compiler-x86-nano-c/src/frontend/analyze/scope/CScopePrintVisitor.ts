import * as R from 'ramda';
import chalk from 'chalk';

import {padLeftLines} from '@compiler/core/utils';

import {CScopeTree} from './CScopeTree';
import {CScopeVisitor, CVisitorEntry} from './CScopeVisitor';
import {
  isCFunctionNode,
  isInnerScoped,
} from './nodes';

/**
 * Iterator that walks over tree and prints it
 *
 * @export
 * @class CScopePrintVisitor
 * @extends {CScopeVisitor}
 */
export class CScopePrintVisitor extends CScopeVisitor {
  private _reduced: string = '';

  get reduced() { return this._reduced; }

  override enter(entry: CVisitorEntry) {
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
   * Enters CScopeTree object and prints it
   *
   * @private
   * @param {CScopeTree} tree
   * @return {string}
   * @memberof CScopePrintVisitor
   */
  private dumpScopeTree(tree: CScopeTree): string {
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
   * @param {CScopeTree} scope
   * @return {string}
   * @memberof CScopePrintVisitor
   */
  static serializeToString(scope: CScopeTree): string {
    return new CScopePrintVisitor().visit(scope).reduced;
  }
}
