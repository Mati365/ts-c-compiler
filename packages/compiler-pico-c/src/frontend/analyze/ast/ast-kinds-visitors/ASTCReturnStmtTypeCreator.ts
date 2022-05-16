import {ASTCCompilerKind, ASTCReturnStatement} from '@compiler/pico-c/frontend/parser/ast';
import {CType, CPrimitiveType} from '../../types';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../errors/CTypeCheckError';
import {ASTCTypeCreator} from './ASTCTypeCreator';

import {checkLeftTypeOverlapping} from '../../checker';

/**
 * Assigns type to ASTCReturnStatement
 *
 * @export
 * @class ASTCReturnStmtTypeCreator
 * @extends {ASTCTypeCreator<ASTCReturnStmt>}
 */
export class ASTCReturnStmtTypeCreator extends ASTCTypeCreator<ASTCReturnStatement> {
  kind = ASTCCompilerKind.ReturnStmt;

  override leave(node: ASTCReturnStatement): void {
    const {context, arch} = this;
    const {fnType} = context.currentAnalyzed;

    if (!fnType) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.RETURN_STMT_OUTSIDE_FUNCTION,
        node.loc.start,
      );
    }

    let returnType: CType = null;
    if (node.hasExpression())
      returnType = node.expression.type;
    else
      returnType = CPrimitiveType.void(arch);

    if (!checkLeftTypeOverlapping(returnType, fnType.returnType)) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.RETURN_EXPRESSION_WRONG_TYPE,
        node.loc.start,
        {
          expected: fnType.returnType?.getShortestDisplayName() ?? '<unknown-fn-return-type>',
          received: returnType?.getShortestDisplayName() ?? '<unknown-expr-type>',
        },
      );
    }

    node.type = returnType;
  }
}
