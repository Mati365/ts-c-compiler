import * as R from 'ramda';

import { arrayToHex } from '@compiler/core/utils/arrayToHexString';
import { X86Compiler } from './X86Compiler';

export const toMultilineBinaryBlockString = R.compose(
  R.map(R.join(' ')),
  R.splitEvery(8),
  arrayToHex,
);

/**
 * Binary portion of data
 */
export class BinaryBlob<T = any> {
  constructor(
    protected ast: T = null,
    protected binary: number[] = null,
    public slaveBlobs: BinaryBlob[] = null, // for some 0 bytes instructions
  ) {}

  getAST() {
    return this.ast;
  }

  getBinary() {
    return this.binary;
  }

  get byteSize() {
    return this.binary.length;
  }

  /**
   * Print blob like objdump
   */
  toString(withAST: boolean = true): string[] {
    const { binary, ast } = this;
    const binLines = toMultilineBinaryBlockString(binary);

    if (!binLines.length || !withAST || !ast) {
      return binLines;
    }

    return [`${binLines[0].padEnd(30)}${ast.toString()}`, ...R.tail(binLines)];
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  compile(compiler?: X86Compiler, offset?: number): BinaryBlob<T> {
    if (!this.binary) {
      this.binary = [];
    }

    return this;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
