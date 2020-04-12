import * as R from 'ramda';

import {arrayToHex} from '@compiler/core/utils/arrayToHexString';
import {X86Compiler} from './X86Compiler';

export const toMultilineBinaryBlockString = R.compose(
  R.map(
    R.join(' '),
  ),
  R.splitEvery(8),
  arrayToHex,
);

/**
 * Binary portion of data
 *
 * @export
 * @class BinaryBlob
 * @template T ast type
 */
export class BinaryBlob<T = any> {
  constructor(
    protected _ast: T = null,
    protected _binary: number[] = null,
    public slaveBlobs: BinaryBlob[] = null, // for some 0 bytes instructions
  ) {}

  get ast() { return this._ast; }
  get binary() { return this._binary; }
  get byteSize() { return this._binary.length; }

  /**
   * Print blob like objdump
   *
   * @param {boolean} [withAST=true]
   * @returns {string[]}
   * @memberof BinaryBlob
   */
  toString(withAST: boolean = true): string[] {
    const {binary, ast} = this;
    const binLines = toMultilineBinaryBlockString(binary);

    if (!binLines.length || !withAST || !ast)
      return binLines;

    return [
      `${binLines[0].padEnd(30)}${ast.toString()}`,
      ...R.tail(binLines),
    ];
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  compile(compiler?: X86Compiler, offset?: number): BinaryBlob<T> {
    if (!this._binary)
      this._binary = [];

    return this;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
