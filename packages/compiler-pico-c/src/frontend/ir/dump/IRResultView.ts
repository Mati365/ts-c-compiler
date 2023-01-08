import * as R from 'ramda';
import chalk from 'chalk';

import { IRInstructionsBlock, isIRFnDeclInstruction } from '../instructions';
import { IRCodeBuilderResult } from '../safeBuildIRCode';
import { IRCodeSegmentBuilderResult } from '../generator';

/**
 * Simple IR serializer. Maybe add graph rendering?
 */
export class IRResultView {
  constructor(private readonly _ir: IRCodeBuilderResult) {}

  get ir() {
    return this._ir;
  }

  static serializeToString(ir: IRCodeBuilderResult): string {
    return new IRResultView(ir).serialize();
  }

  /**
   * Iterates branch by branch and transforms branches to string
   */
  serialize(): string {
    const {
      segments: { code, data },
    } = this.ir;

    const dataStr = IRResultView.serializeCodeBlock(
      new IRInstructionsBlock({
        name: 'Data',
        instructions: data.instructions,
        jmps: {},
      }),
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
   */
  static serializeCodeSegment(code: IRCodeSegmentBuilderResult): string[] {
    return R.values(code.functions).reduce((acc, fn, index, array) => {
      acc.push(IRResultView.serializeCodeBlock(fn.block));

      if (index + 1 < array.length) {
        acc.push('\n');
      }

      return acc;
    }, []);
  }

  /**
   * Serialize code block to multiline string
   */
  static serializeCodeBlock(block: IRInstructionsBlock): string {
    const { name, instructions, jmps } = block;
    if (R.isEmpty(instructions)) {
      return null;
    }

    const lines: string[] = [
      chalk.bold.greenBright(`# --- Block ${name || '<unknown>'} ---`),
    ];

    instructions.forEach(instruction => {
      let str = instruction.getDisplayName();
      if (!isIRFnDeclInstruction(instruction)) {
        str = `  ${str}`;
      }

      lines.push(str);
    });

    let result = lines.join('\n');
    if (jmps.always) {
      result = [result, this.serializeCodeBlock(jmps.always)].join('\n');
    }

    return result;
  }
}
