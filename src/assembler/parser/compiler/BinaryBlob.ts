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
}
