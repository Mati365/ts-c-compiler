import * as R from 'ramda';

import {ASTCCompilerKind, ASTCInitializer} from '@compiler/x86-nano-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';
import {CTypeCheckError, CTypeCheckErrorCode} from '../../../errors/CTypeCheckError';
import {CType} from '../../../types/CType';

/**
 * Assigns type to ASTCInitializer
 *
 * @export
 * @class ASTCInitializerTypeCreator
 * @extends {ASTCTypeCreator<ASTCInitializer>}
 */
export class ASTCInitializerTypeCreator extends ASTCTypeCreator<ASTCInitializer> {
  kind = ASTCCompilerKind.Initializer;

  override leave(node: ASTCInitializer): void {
    let type: CType = null;

    if (node.assignmentExpression)
      type = node.assignmentExpression.type;
    else
      type = R.last(node.initializers || [])?.type;

    if (!type) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNKNOWN_INITIALIZER_TYPE,
        node.loc.start,
      );
    }

    node.type = type;
  }
}
