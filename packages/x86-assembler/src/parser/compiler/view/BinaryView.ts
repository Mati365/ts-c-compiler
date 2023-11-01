import * as E from 'fp-ts/Either';
import { pipe } from 'fp-ts/function';

import { CompilerError } from '@ts-c-compiler/core';
import { CompilerFinalResult, CompilerOutput } from '../compile';

/**
 * Class used for binary representation of compiler binary tree
 * It can be used in serveral modes, such as terminal output or
 * graphical output
 */
export class BinaryView<ResultType, SerializeArgs = never> {
  constructor(private readonly _compilerResult: CompilerFinalResult) {}

  get compilerResult() {
    return this._compilerResult;
  }

  /* eslint-disable @typescript-eslint/no-unused-vars, class-methods-use-this */
  /**
   * Serialize success into result type
   */
  success(output: CompilerOutput, args?: SerializeArgs): ResultType {
    return null;
  }

  /**
   * Serialize errors and args into result type
   */
  error(errors: CompilerError[], args?: SerializeArgs): ResultType {
    return null;
  }
  /* eslint-enable @typescript-eslint/no-unused-vars, class-methods-use-this */

  /**
   * Serializes view into result type
   */
  serialize(args?: SerializeArgs): ResultType {
    return pipe(
      this.compilerResult,
      E.match(
        output => this.error(output, args),
        output => this.success(output, args),
      ),
    );
  }
}
