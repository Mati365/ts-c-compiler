import * as R from 'ramda';
import chalk from 'chalk';

import { padLeftLines } from '@compiler/core/utils';

import { CScopeTree } from '../scope/CScopeTree';
import { CScopeVisitor } from '../scope/CScopeVisitor';

/**
 * Iterator that walks over tree and prints it
 */
export class CScopePrintVisitor extends CScopeVisitor {
  private _reduced: string = '';

  get reduced() {
    return this._reduced;
  }

  override enter(tree: CScopeTree) {
    const { nesting } = this;
    const nodeName = tree.parentAST?.type?.getDisplayName() ?? '<anonymous>';

    const scopeLines = (() => {
      let innerScopeLines = this.dumpScopeTree(tree) || [];

      if (R.isEmpty(innerScopeLines)) {
        innerScopeLines = [chalk.grey('<blank>')];
      }

      return [
        chalk.bold.white('Scope:'),
        ...padLeftLines(1, innerScopeLines),
        '\n',
      ];
    })();

    const lines = padLeftLines(nesting * 2, [
      `${chalk.bold.white('Node:')} ${chalk.yellowBright(nodeName)}`,
      ...scopeLines,
    ]);

    this._reduced += lines.join('\n');
  }

  override leave() {
    const { nesting } = this;
    if (nesting === 1) {
      this._reduced = this._reduced.replace(/^\s+|\s+$/g, '');
    }
  }

  /**
   * Enters CScopeTree object and prints it
   */
  private dumpScopeTree(tree: CScopeTree): string[] {
    const { types, variables, typedefs } = tree.dump();
    let lines: string[] = [];

    if (!R.isEmpty(types)) {
      lines = [
        ...lines,
        chalk.white('+ Types:'),
        ...R.toPairs(types).flatMap(([name, type]) => {
          const typeLines = type
            .getDisplayName()
            .split('\n')
            .map(str => chalk.yellowBright(str));

          const prefix = `  + ${name}: `;
          return [
            `${chalk.bold.green(prefix)}${typeLines[0]}`,
            ...R.tail(typeLines).map(R.concat(' '.padStart(prefix.length))),
          ];
        }),
      ];
    }

    if (!R.isEmpty(variables)) {
      lines = [
        ...lines,
        chalk.white('+ Variables:'),
        ...R.values(variables).map(variable =>
          chalk.bold.green(`  + ${variable.getDisplayName()};`),
        ),
      ];
    }

    if (!R.isEmpty(typedefs)) {
      lines = [
        ...lines,
        chalk.white('+ Typedefs:'),
        ...R.values(typedefs).map(typedef =>
          chalk.bold.green(`  + ${typedef.getDisplayName()};`),
        ),
      ];
    }

    return lines;
  }

  /**
   * Print whole scoped tree to string
   */
  static serializeToString(scope: CScopeTree): string {
    return new CScopePrintVisitor().visit(scope).reduced;
  }
}
