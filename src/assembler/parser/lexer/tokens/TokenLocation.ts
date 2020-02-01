/**
 * Provides row/column position of token inside source code
 *
 * @export
 * @class TokenLocation
 */
export class TokenLocation {
  public row: number;
  public column: number;

  constructor(row: number = 0, column: number = 0) {
    this.row = row;
    this.column = column;
  }

  clone(): TokenLocation {
    const {row, column} = this;

    return new TokenLocation(row, column);
  }
}
