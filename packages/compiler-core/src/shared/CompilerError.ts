import {format} from '../utils/format';

/**
 * Errors thrown during compiling
 *
 * @export
 * @class CompilerError
 * @extends {Error}
 * @template CodeType
 * @template LocType
 */
export class CompilerError<CodeType, LocType> extends Error {
  constructor(
    public readonly translations: object,
    public readonly code: CodeType,
    public readonly loc?: LocType,
    public readonly meta?: object,
  ) {
    super();

    this.name = 'CompilerError';
    this.message = format(
      this.translations[<any> code],
      meta || {},
    );

    if (this.loc)
      this.message = `${this.loc.toString()}: ${this.message}`;
  }
}
