import * as R from 'ramda';

import {ParserError, ParserErrorCode} from '@compiler/x86-assembler/shared/ParserError';
import {ASTTimes} from '../../ast/critical/ASTTimes';
import {ASTAsmTree} from '../../ast/ASTAsmParser';
import {ASTLabelAddrResolver} from '../../ast/instruction/ASTResolvableArg';

import {BinaryBlob} from '../BinaryBlob';
import {X86Compiler} from '../X86Compiler';
import {FirstPassResult} from '../BinaryPassResults';

import {rpnTokens} from '../utils';

/**
 * Define binary set of data
 *
 * @export
 * @class BinaryRepeatedNode
 * @extends {BinaryBlob<ASTDef>}
 */
export class BinaryRepeatedNode extends BinaryBlob<ASTTimes> {
  /**
   * Emits repeated instructions
   *
   * @param {X86Compiler} compiler
   * @param {number} offset
   * @param {ASTLabelAddrResolver} labelResolver
   * @returns {FirstPassResult}
   * @memberof BinaryRepeatedNode
   */
  pass(
    compiler: X86Compiler,
    offset: number,
    labelResolver: ASTLabelAddrResolver,
  ): FirstPassResult {
    const {
      ast: {
        loc,
        timesExpression,
        repatedNodesTree,
      },
    } = this;

    const times = rpnTokens(
      timesExpression,
      {
        keywordResolver: labelResolver,
      },
    );

    if (times < 0) {
      throw new ParserError(
        ParserErrorCode.INCORRECT_TIMES_VALUE,
        loc.start,
        {
          times,
        },
      );
    }

    const compiledPass = compiler.firstPass(
      new ASTAsmTree(
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
