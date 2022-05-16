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
  private value: number = null;
  private labeled: boolean = false;

  constructor(ast: ASTEqu) {
    super(ast);

    this.pass();
    this.labeled = R.isNil(this.value);
  }

  getValue() { return this.value; }
  isLabeled() { return this.labeled; }

  pass(labelResolver?: ASTLabelAddrResolver): BinaryEqu {
    const {ast} = this;
    const result = safeKeywordResultRPN(
      {
        keywordResolver: labelResolver,
      },
      ast.expression,
    );

    if (result.isOk())
      this.value = result.unwrap();
    else
      this.value = null;

    return this;
  }
}
