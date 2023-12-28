import { CType } from './CType';

export class CUnknownType extends CType {
  getDisplayName() {
    return 'unknown';
  }

  override isUnknown() {
    return true;
  }

  override isEqual() {
    return true;
  }
}
