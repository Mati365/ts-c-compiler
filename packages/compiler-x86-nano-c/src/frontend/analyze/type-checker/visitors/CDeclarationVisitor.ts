import {ASTCDeclaration} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CTypeTreeVisitor} from './CTypeTreeVisitor';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../errors/CTypeCheckError';

import {resolveDeclarationNamedEntry} from '../resolver';
import {isNamedType} from '../helpers/isNamedType';

/**
 * Enters variable declaration
 *
 * @export
 * @class CDeclarationVisitor
 * @extends {CTypeTreeVisitor}
 */
export class CDeclarationVisitor extends CTypeTreeVisitor {
  initForRootNode(declaration: ASTCDeclaration): this {
    const {context, scope} = this;
    const entry = resolveDeclarationNamedEntry(
      {
        declaration,
        context,
      },
    );

    if (!entry?.type)
      throw new CTypeCheckError(CTypeCheckErrorCode.UNABLE_TO_EXTRACT_DECLARATION_TYPE);

    const {type} = entry;
    if (isNamedType(type) && !type.isRegistered()) {
      scope
        .defineType(type.name, type)
        .unwrapOrThrow();
    }

    return this;
  }
}
