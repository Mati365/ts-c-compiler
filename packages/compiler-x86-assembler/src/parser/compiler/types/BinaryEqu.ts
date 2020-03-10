import * as R from 'ramda';

import {safeKeywordResultRPN} from '../utils';

import {BinaryBlob} from '../BinaryBlob';
import {ASTLabelAddrResolver} from '../../ast/instruction/ASTResolvableArg';
import {ASTEqu} from '../../ast/critical/ASTEqu';

/**
 * Defines something similar to label but not label
 *
 * @export
 * @class BinaryEqu
 * @extends {BinaryBlob<ASTEqu>}
 */
export class BinaryEqu extends BinaryBlob<ASTEqu> {
  private _value: number = null;
  private _labeled: boolean = false;

  constructor(ast: ASTEqu) {
    super(ast);

    this.pass();
    this._labeled = R.isNil(this._value);
  }

  get val() { return this._value; }
  get labeled() { return this._labeled; }

  pass(labelResolver?: ASTLabelAddrResolver): BinaryEqu {
    const {ast} = this;
    const result = safeKeywordResultRPN(
      {
        keywordResolver: labelResolver,
      },
      ast.expression,
    );

    if (result.isOk())
      this._value = result.unwrap();
    else
      this._value = null;

    return this;
  }
}
