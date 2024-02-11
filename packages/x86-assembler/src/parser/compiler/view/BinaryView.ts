import { SecondPassResult } from '../BinaryPassResults';

/**
 * Class used for binary representation of compiler binary tree
 * It can be used in serveral modes, such as terminal output or
 * graphical output
 */
export class BinaryView<ResultType, SerializeArgs = never> {
  constructor(private readonly _compilerResult: SecondPassResult) {}

  get compilerResult() {
    return this._compilerResult;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars, class-methods-use-this */
  /**
   * Serialize success into result type
   */
  success(output: SecondPassResult, args?: SerializeArgs): ResultType {
    return null;
  }

  /* eslint-enable @typescript-eslint/no-unused-vars, class-methods-use-this */

  /**
   * Serializes view into result type
   */
  serialize(args?: SerializeArgs): ResultType {
    return this.success(this.compilerResult, args);
  }
}
