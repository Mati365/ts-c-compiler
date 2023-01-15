import { format } from '../utils';
import { CodeTranslatedError } from './CodeTranslatedError';

export function fixme(str: string) {
  return `[[ fixme ]] ${str}`;
}

/**
 * Errors thrown during compiling
 */
export class CompilerError<C = any, L = any> extends CodeTranslatedError<C> {
  constructor(translations: object, code: C, readonly loc?: L, meta?: object) {
    super(translations, code, meta);
    this.name = 'Compiler';
  }

  /**
   * Returns log with location if provided
   */
  getCompilerMessage(): string {
    const { loc, message, name, meta } = this;
    const formattedMessage = format(message, meta || {});

    if (!loc) {
      return formattedMessage;
    }

    return `(${loc.toString()}): <${name}> ${formattedMessage}`;
  }
}
