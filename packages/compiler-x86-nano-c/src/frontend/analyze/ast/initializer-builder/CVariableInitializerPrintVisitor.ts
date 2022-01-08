import {CVariableInitializerVisitor} from './CVariableInitializerVisitor';
import {
  CVariableInitializerTree,
  CVariableInitializeValue,
  isInitializerTreeValue,
} from '../../scope/variables/CVariableInitializerTree';

/**
 * Iterates over initializer and prints it
 *
 * @export
 * @class CVariableInitializerPrintVisitor
 * @extends {CVariableInitializerVisitor}
 */
export class CVariableInitializerPrintVisitor extends CVariableInitializerVisitor {
  private _reduced: string = '';

  get reduced() { return this._reduced; }

  override enter(value: CVariableInitializeValue) {
    if (this._reduced && this._reduced[this._reduced.length - 2] !== '{')
      this._reduced += ', ';

    this._reduced += (
      isInitializerTreeValue(value)
        ? '{ '
        : value
    );
  }

  override leave(value: CVariableInitializeValue) {
    if (isInitializerTreeValue(value))
      this._reduced += ' }';
  }

  /**
   * Print whole C initializer to string
   *
   * @static
   * @param {CVariableInitializerTree} scope
   * @return {string}
   * @memberof CVariableInitializerPrintVisitor
   */
  static serializeToString(scope: CVariableInitializerTree): string {
    return new CVariableInitializerPrintVisitor().visit(scope).reduced;
  }
}
