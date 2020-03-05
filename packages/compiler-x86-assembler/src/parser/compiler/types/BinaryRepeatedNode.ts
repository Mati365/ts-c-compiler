import * as R from 'ramda';

import {ASTTimes} from '../../ast/critical/ASTTimes';
import {ASTTree} from '../../ast/ASTParser';

import {BinaryBlob} from '../BinaryBlob';
import {X86Compiler} from '../compile';
import {FirstPassResult} from '../BinaryPassResults';

/**
 * Define binary set of data
 *
 * @export
 * @class BinaryRepeatedNode
 * @extends {BinaryBlob<ASTDef>}
 */
export class BinaryRepeatedNode extends BinaryBlob<ASTTimes> {
  pass(compiler: X86Compiler, offset: number): FirstPassResult {
    const {
      ast: {
        timesExpression,
        repatedNodesTree,
      },
    } = this;

    const times = +timesExpression[0].value.number;
    const compiledPass = compiler.firstPass(
      new ASTTree(
        R.times(
          () => repatedNodesTree.astNodes[0].clone(),
          times,
        ),
      ),
      true,
      offset,
    );

    return compiledPass;
  }
}
