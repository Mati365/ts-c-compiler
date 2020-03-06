import * as R from 'ramda';
import {X86Compiler} from './X86Compiler';

const toMultilineBinaryBlockString = R.compose(
  R.map(
    R.join(' '),
  ),
  R.splitEvery(8),
  R.map(
    (num: number) => `${num.toString(16).padStart(2, '0')}`,
  ),
);

/**
 * Binary portion of data
 *
 * @export
 * @class BinaryBlob
 */
export class BinaryBlob<ASTNodeType = any> {
  constructor(
    protected _ast: ASTNodeType = null,
    protected _binary: number[] = null,
  ) {}

  get ast() { return this._ast; }
  get binary() { return this._binary; }

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
  compile(compiler?: X86Compiler, offset?: number): BinaryBlob<ASTNodeType> {
    if (!this._binary)
      this._binary = [];

    return this;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
