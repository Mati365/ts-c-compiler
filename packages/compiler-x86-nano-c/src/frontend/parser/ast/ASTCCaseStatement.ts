import {walkOverFields} from '@compiler/grammar/decorators/walkOverFields';

import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';

/**
 * Statement with:
 *  dupa:
 *
 * @export
 * @class ASTCCaseStatement
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'expression',
      'statement',
    ],
  },
)
export class ASTCCaseStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly expression: ASTCCompilerNode,
    public readonly statement: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.CaseStmt, loc);
  }
}

/**
 * Statement with:
 *  default:
 *
 * @export
 * @class ASTCDefaultCaseStatement
 * @extends {ASTCCompilerNode}
 */
@walkOverFields(
  {
    fields: [
      'statement',
    ],
  },
)
export class ASTCDefaultCaseStatement extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly statement: ASTCCompilerNode,
  ) {
    super(ASTCCompilerKind.DefaultCaseStmt, loc);
  }
}
