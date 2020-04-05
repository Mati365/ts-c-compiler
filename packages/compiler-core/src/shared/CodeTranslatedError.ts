import {format} from '../utils/format';

export class CodeTranslatedError<C = any> extends Error {
  constructor(
    public readonly translations: object,
    public readonly code: C,
    public readonly meta?: object,
  ) {
    super();
    this.message = format(
      this.translations[<any> code],
      meta || {},
    );
  }
}
