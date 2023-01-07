import { format } from '../utils/format';

export class CodeTranslatedError<C = any> extends Error {
  constructor(
    readonly translations: object,
    readonly code: C,
    readonly meta?: object,
  ) {
    super();
    this.message = format(this.translations[<any>code], meta || {});
  }
}
