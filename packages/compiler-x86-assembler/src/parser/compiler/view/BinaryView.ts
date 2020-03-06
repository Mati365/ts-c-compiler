import {CompilerFinalResult} from '../compile';

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
  serialize(args: SerializeArgs): ResultType {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars, class-methods-use-this */
}
