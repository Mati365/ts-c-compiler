import * as R from 'ramda';
import {MathError, MathErrorCode} from './MathError';

export type MathOperatorResolver = (args: number[]) => number;

/**
 * Defines priority and character of math operator
 *
 * @export
 * @class MathOperator
 */
export class MathOperator {
  static readonly LEFT_BRACKET = new MathOperator(0, '(', 0, null);
  static readonly RIGHT_BRACKET = new MathOperator(0, ')', 0, null);

  static readonly BIT_SHIFT_LEFT = new MathOperator(1, '<<', 2, (args) => args[0] << args[1]);
  static readonly BIT_SHIFT_RIGHT = new MathOperator(1, '>>', 2, (args) => args[0] >> args[1]);

  static readonly BIT_OR = new MathOperator(1, '|', 2, (args) => args[0] | args[1]);
  static readonly BIT_AND = new MathOperator(1, '&', 2, (args) => args[0] & args[1]);

  static readonly PLUS = new MathOperator(2, '+', 2, (args) => args[0] + args[1]);
  static readonly MINUS = new MathOperator(2, '-', 2, (args) => args[0] - args[1]);
  static readonly MUL = new MathOperator(3, '*', 2, (args) => args[0] * args[1]);
  static readonly DIV = new MathOperator(
    3, '/', 2,
    (args) => {
      if (args[1] === 0)
        throw new MathError(MathErrorCode.DIVISION_BY_ZERO);

      return args[0] / args[1];
    },
  );

  static readonly MOD = new MathOperator(3, '%', 2, (args) => args[0] % args[1]);
  static readonly POW = new MathOperator(4, '^', 2, (args) => args[0] ** args[1]);

  static readonly OPERATORS: MathOperator[] = [
    MathOperator.BIT_SHIFT_LEFT,
    MathOperator.BIT_SHIFT_RIGHT,
    MathOperator.BIT_OR,
    MathOperator.BIT_AND,
    MathOperator.LEFT_BRACKET,
    MathOperator.RIGHT_BRACKET,
    MathOperator.PLUS,
    MathOperator.MINUS,
    MathOperator.MUL,
    MathOperator.DIV,
    MathOperator.MOD,
    MathOperator.POW,
  ];

  static readonly OPERATORS_MAP: Record<string, MathOperator> = R.reduce(
    (acc, op) => {
      acc[op.char] = op;
      return acc;
    },
    {},
    MathOperator.OPERATORS,
  );

  static MATCH_OPERATOR_REGEX = new RegExp(
    `([${R.reduce(
      (acc, op) => `${acc}\\${op.char}`,
      '',
      MathOperator.OPERATORS,
    )}])`,
  );

  constructor(
    public readonly priority: number,
    public readonly char: string,
    public readonly argsCount: number,
    public readonly resolver: MathOperatorResolver = null,
    public readonly rightHand: boolean = false, // right hand is a = b = c
  ) {}

  toString() { return this.char; }

  /**
   * Search operator by name
   *
   * @static
   * @param {string} char
   * @returns {MathOperator}
   * @memberof MathOperator
   */
  static findOperatorByCharacter(char: string): MathOperator {
    return MathOperator.OPERATORS_MAP[char];
  }
}
