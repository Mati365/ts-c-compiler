import { isNil } from 'ramda';
import { isTreeNode } from '@ts-cc/grammar';

import { CVariableInitializerVisitor } from './CVariableInitializerVisitor';
import {
  CVariableInitializePair,
  CVariableInitializeValue,
  CVariableInitializerTree,
  isInitializerValuePair,
} from '../../scope/variables/CVariableInitializerTree';

/**
 * Iterates over initializer and prints it
 */
export class CVariableInitializerPrintVisitor extends CVariableInitializerVisitor {
  private _reduced: string = '';

  get reduced() {
    return this._reduced;
  }

  override enter(maybePair: CVariableInitializePair | CVariableInitializerTree) {
    if (this._reduced && this._reduced[this._reduced.length - 2] !== '{') {
      this._reduced += ', ';
    }

    let serializedValue: CVariableInitializeValue = '';

    if (isTreeNode(maybePair)) {
      serializedValue = '{ ';
    } else if (isInitializerValuePair(maybePair)) {
      if (isTreeNode(maybePair.value)) {
        serializedValue = '<expr>';
      } else {
        serializedValue = maybePair.value;
      }
    } else if (isNil(maybePair)) {
      serializedValue = 'null';
    }

    if (serializedValue) {
      this._reduced += serializedValue;
    }
  }

  override leave(maybePair: CVariableInitializePair | CVariableInitializerTree) {
    if (isTreeNode(maybePair)) {
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
