import {truncateText} from '../../utils/truncateText';
import {X86Compiler} from './compile';

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
   * @returns {string}
   * @memberof BinaryBlob
   */
  toString(withAST: boolean = true): string {
    const {binary, ast} = this;
    const binStr = truncateText(
      ' ...',
      25,
      binary
        .map(
          (num) => `0x${num.toString(16).padStart(2, '0')}`,
        )
        .join(' '),
    );

    if (!withAST || !ast)
      return binStr;

    return `${binStr.padEnd(32)}${ast.toString()}`;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars */
  compile(compiler?: X86Compiler, offset?: number): BinaryBlob<ASTNodeType> {
    if (!this._binary)
      this._binary = [];

    return this;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars */
}
