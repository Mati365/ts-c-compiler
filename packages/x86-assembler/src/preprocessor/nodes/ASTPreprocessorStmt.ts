import * as R from 'ramda';

import { NodeLocation } from '@ts-c/grammar';
import { PreprocessorInterpreter } from '../interpreter/PreprocessorInterpreter';
import { ASTPreprocessorKind, ASTPreprocessorNode } from '../constants';

export class ASTPreprocessorStmt extends ASTPreprocessorNode {
  constructor(loc: NodeLocation, children: ASTPreprocessorNode[]) {
    super(ASTPreprocessorKind.Stmt, loc, children);
  }

  toEmitterLine(interpreter: PreprocessorInterpreter): string {
    const { children } = this;

    if (children) {
      return R.reduce(
        (acc, node) => {
          const str = node.toEmitterLine(interpreter);
          if (str) {
            acc += `${str}\n`;
          }

          return acc;
        },
        '',
        children,
      );
    }

    return '';
  }

  /**
   * Iterates through tree
   */
  exec(interpreter: PreprocessorInterpreter): void {
    const { children } = this;

    if (children) {
      R.forEach(child => {
        child.exec(interpreter);
      }, children);
    }
  }
}
