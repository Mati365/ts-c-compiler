import * as R from 'ramda';
import chalk from 'chalk';

import {CIRInstructionsBlock} from '../instructions';
import {IRCodeBuilderResult} from '../sefeBuildIRCode';

import {isIRLabeledInstruction} from '../guards';

/**
 * Simple IR serializer. Maybe add graph rendering?
 *
 * @export
 * @class CIRResultView
 */
export class CIRResultView {
  constructor(
    private readonly _ir: IRCodeBuilderResult,
  ) {}

  get ir() { return this._ir; }

  static serializeToString(ir: IRCodeBuilderResult): string {
    return new CIRResultView(ir).serialize();
  }

  /**
   * Iterates branch by branch and transforms branches to string
   *
   * @return {string}
   * @memberof CIRResultView
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
          CIRResultView.serializeCodeBlock(block),
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
   * @param {CIRInstructionsBlock} block
   * @return {string}
   * @memberof CIRResultView
   */
  static serializeCodeBlock(block: CIRInstructionsBlock): string {
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
