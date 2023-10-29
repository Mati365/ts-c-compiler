import { isTreeNode } from '@ts-c-compiler/grammar';

import { CVariableInitializerVisitor } from './CVariableInitializerVisitor';
import {
  CVariableInitializerTree,
  CVariableInitializeValue,
  isInitializerTreeValue,
} from '../../scope/variables/CVariableInitializerTree';

/**
 * Iterates over initializer and prints it
 */
export class CVariableInitializerPrintVisitor extends CVariableInitializerVisitor {
  private _reduced: string = '';

  get reduced() {
    return this._reduced;
  }

  override enter(value: CVariableInitializeValue) {
    if (this._reduced && this._reduced[this._reduced.length - 2] !== '{') {
      this._reduced += ', ';
    }

    let serializedValue = value;
    if (isInitializerTreeValue(value)) {
      serializedValue = '{ ';
    } else if (isTreeNode(value)) {
      serializedValue = '<expr>';
    }

    this._reduced += serializedValue;
  }

  override leave(value: CVariableInitializeValue) {
    if (isInitializerTreeValue(value)) {
      this._reduced += ' }';
    }
  }

  /**
   * Print whole C initializer to string
   */
  static serializeToString(scope: CVariableInitializerTree): string {
    return new CVariableInitializerPrintVisitor().visit(scope).reduced;
  }
}
