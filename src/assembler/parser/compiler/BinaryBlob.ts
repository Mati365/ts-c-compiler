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
    const binStr = binary
      .map(
        (num) => `0x${num.toString(16).padStart(2, '0')}`,
      )
      .join(', ');

    if (!withAST || !ast)
      return binStr;

    const astStr = ast.toString().padEnd(15);
    return `${astStr} ${binStr}`;
  }
}
