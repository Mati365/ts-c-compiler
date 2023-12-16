import { CType } from './CType';

export class CUnknownType extends CType {
  getDisplayName() {
    return 'unknown';
  }

  override isEqual() {
    return true;
  }
}
