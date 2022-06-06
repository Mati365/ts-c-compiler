import * as R from 'ramda';
import chalk from 'chalk';

import {IRInstructionsBlock} from '../instructions';
import {IRCodeBuilderResult} from '../sefeBuildIRCode';

import {isIRLabeledInstruction} from '../guards';

/**
 * Simple IR serializer. Maybe add graph rendering?
 *
 * @export
 * @class IRResultView
 */
export class IRResultView {
  constructor(
    private readonly _ir: IRCodeBuilderResult,
  ) {}

  get ir() { return this._ir; }

  static serializeToString(ir: IRCodeBuilderResult): string {
    return new IRResultView(ir).serialize();
  }

  /**
   * Iterates branch by branch and transforms branches to string
   *
   * @return {string}
   * @memberof IRResultView
   */
  serialize(): string {
    const {
      branches: {
        blocks,
      },
    } = this.ir;

    return R.values(blocks).reduce(
      (acc, block) => {
        acc.push(
          IRResultView.serializeCodeBlock(block),
        );

        return acc;
      },
      [],
    ).join('\n\n');
  }

  /**
   * Serialize code block to multiline string
   *
   * @static
   * @param {IRInstructionsBlock} block
   * @return {string}
   * @memberof IRResultView
   */
  static serializeCodeBlock(block: IRInstructionsBlock): string {
    const lines: string[] = [
      chalk.bold.greenBright(`; --- Block ${block.name || '<unknown>'} ---`),
    ];

    block.instructions.forEach((instruction) => {
      let str = instruction.getDisplayName();
      if (!isIRLabeledInstruction(instruction))
        str = `  ${str}`;

      lines.push(str);
    });

    return lines.join('\n');
  }
}
