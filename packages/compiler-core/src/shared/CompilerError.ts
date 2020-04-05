import {CodeTranslatedError} from './CodeTranslatedError';

/**
 * Errors thrown during compiling
 *
 * @export
 * @class CompilerError
 * @extends {Error}
 * @template C CodeType
 * @template L LocationType
 */
export class CompilerError<C = any, L = any> extends CodeTranslatedError<C> {
  constructor(
    translations: object,
    code: C,
    public readonly loc?: L,
    meta?: object,
  ) {
    super(translations, code, meta);
    this.name = 'Compiler';
  }

  /**
   * Returns log with location if provided
   *
   * @returns {string}
   * @memberof CompilerError
   */
  getCompilerMessage(): string {
    const {loc, message, name} = this;
    if (!loc)
      return message;

    return `(${loc.toString()}): <${name}> ${message}`;
  }
}
