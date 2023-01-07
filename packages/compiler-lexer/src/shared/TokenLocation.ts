/**
 * Provides row/column position of token inside source code
 */
export class TokenLocation {
  constructor(public row: number = 0, public column: number = 0) {}

  append(row: number, column: number = 0): TokenLocation {
    return new TokenLocation(this.row + row, this.column + column);
  }

  clone(): TokenLocation {
    const { row, column } = this;

    return new TokenLocation(row, column);
  }

  toString() {
    const { row, column } = this;

    return `row: ${row + 1}, col: ${column + 1}`;
  }
}
