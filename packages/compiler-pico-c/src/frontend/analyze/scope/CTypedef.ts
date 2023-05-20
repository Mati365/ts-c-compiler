import { CNamedTypedEntry, CVariable } from './variables';

export class CTypedef extends CNamedTypedEntry {
  static ofVariable({ name, type }: CVariable) {
    return new CTypedef({
      name,
      type,
    });
  }
}
