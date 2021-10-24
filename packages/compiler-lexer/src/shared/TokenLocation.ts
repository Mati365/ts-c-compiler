/**
 * Provides row/column position of token inside source code
 *
 * @export
 * @class TokenLocation
 */
export class TokenLocation {
  constructor(
    public row: number = 0,
    public column: number = 0,
  ) {}

  clone(): TokenLocation {
    const {row, column} = this;

    return new TokenLocation(row, column);
  }

  toString() {
    const {row, column} = this;

    return `row: ${row + 1}, col: ${column + 1}`;
  }
}
