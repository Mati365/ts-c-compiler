/**
 * Provides row/column position of token inside source code
 */
export class TokenLocation {
  constructor(
    public row: number = 0,
    public column: number = 0,
    public pathname: string | null = null,
  ) {}

  append(row: number, column: number = 0): TokenLocation {
    return new TokenLocation(this.row + row, this.column + column, this.pathname);
  }

  clone(): TokenLocation {
    return new TokenLocation(this.row, this.column, this.pathname);
  }

  toString() {
    const { row, column } = this;

    return `row: ${row + 1}, col: ${column + 1}`;
  }
}
