import {NodeLocation} from '@compiler/grammar/tree/NodeLocation';
import {ASTCCompilerKind, ASTCCompilerNode} from './ASTCCompilerNode';
import {ASTCStmt} from './ASTCStmt';
import {ASTCType} from './ASTCType';

/**
 * Single function typed argument
 *
 * @export
 * @class ASTCFunctionArg
 * @extends {ASTCCompilerNode}
 */
export class ASTCFunctionArg extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly type: ASTCType,
    public readonly name: string,
  ) {
    super(ASTCCompilerKind.Type, loc);
  }
}

/**
 * C function declaration
 *
 * @export
 * @class ASTCFunction
 * @extends {ASTCCompilerNode}
 */
export class ASTCFunction extends ASTCCompilerNode {
  constructor(
    loc: NodeLocation,
    public readonly type: ASTCType,
    public readonly name: string,
    public readonly args: ASTCFunctionArg[],
    public readonly body: ASTCStmt,
  ) {
    super(ASTCCompilerKind.Type, loc);
  }
}
