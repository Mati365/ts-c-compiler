import * as R from 'ramda';
import chalk from 'chalk';

import {IRInstructionsBlock, isIRFnDeclInstruction} from '../instructions';
import {IRCodeBuilderResult} from '../safeBuildIRCode';
import {IRCodeSegmentBuilderResult} from '../generator';

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
      segments: {
        code,
        data,
      },
    } = this.ir;

    const dataStr = IRResultView.serializeCodeBlock(
      new IRInstructionsBlock(
        {
          name: 'Data',
          instructions: data.instructions,
        },
      ),
    );

    return [
      ...IRResultView.serializeCodeSegment(code),
      dataStr && `\n${dataStr}`,
    ]
      .filter(Boolean)
      .join('\n');
  }

  /**
   * Serializes code segment with branches
   *
   * @static
   * @param {IRCodeSegmentBuilderResult} code
   * @return {string[]}
   * @memberof IRResultView
   */
  static serializeCodeSegment(code: IRCodeSegmentBuilderResult): string[] {
    return R.values(code.blocks).reduce(
      (acc, block, index, array) => {
        acc.push(
          IRResultView.serializeCodeBlock(block),
        );

        if (index + 1 < array.length)
          acc.push('\n');

        return acc;
      },
      [],
    );
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
    const {name, instructions} = block;
    if (R.isEmpty(instructions))
      return null;

    const lines: string[] = [
      chalk.bold.greenBright(`# --- Block ${name || '<unknown>'} ---`),
    ];

    instructions.forEach((instruction) => {
      let str = instruction.getDisplayName();
      if (!isIRFnDeclInstruction(instruction))
        str = `  ${str}`;

      lines.push(str);
    });

    return lines.join('\n');
  }
}
