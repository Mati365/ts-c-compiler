import {isTreeNode} from '@compiler/grammar/tree/TreeNode';

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

    let serializedValue = value;
    if (isInitializerTreeValue(value))
      serializedValue = '{ ';
    else if (isTreeNode(value))
      serializedValue = '<expr>';

    this._reduced += serializedValue;
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
