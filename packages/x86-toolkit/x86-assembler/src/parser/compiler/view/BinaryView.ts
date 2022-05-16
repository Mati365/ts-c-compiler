import {CompilerError} from '@compiler/core/shared/CompilerError';
import {CompilerFinalResult, CompilerOutput} from '../compile';

/**
 * Class used for binary representation of compiler binary tree
 * It can be used in serveral modes, such as terminal output or
 * graphical output
 *
 * @export
 * @class BinaryView
 * @template ResultType
 */
export class BinaryView<ResultType, SerializeArgs = never> {
  constructor(
    private readonly _compilerResult: CompilerFinalResult,
  ) {}

  get compilerResult() { return this._compilerResult; }

  /* eslint-disable @typescript-eslint/no-unused-vars, class-methods-use-this */
  /**
   * Serialize success into result type
   *
   * @param {CompilerOutput} output
   * @param {SerializeArgs} [args]
   * @returns {ResultType}
   * @memberof BinaryView
   */
  success(output: CompilerOutput, args?: SerializeArgs): ResultType {
    return null;
  }

  /**
   * Serialize errors and args into result type
   *
   * @param {CompilerError[]} errors
   * @param {SerializeArgs} [args]
   * @returns {ResultType}
   * @memberof BinaryView
   */
  error(errors: CompilerError[], args?: SerializeArgs): ResultType {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars, class-methods-use-this */

  /**
   * Serializes view into result type
   *
   * @param {SerializeArgs} args
   * @returns {ResultType}
   * @memberof BinaryView
   */
  serialize(args?: SerializeArgs): ResultType {
    return this.compilerResult.match(
      {
        ok: (output) => this.success(output, args),
        err: (output) => this.error(output, args),
      },
    );
  }
}
