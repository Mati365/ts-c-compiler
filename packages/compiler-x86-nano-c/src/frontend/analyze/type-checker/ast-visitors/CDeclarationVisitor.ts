import {ASTCDeclaration} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CTypeTreeVisitor} from './CTypeTreeVisitor';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../errors/CTypeCheckError';

import {isNamedType} from '../helpers/isNamedType';
import {
  extractInitDeclaratorTypeVariables,
  extractSpecifierType,
} from '../ast-resolver';

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
    const {initList} = declaration;

    const type = extractSpecifierType(
      {
        specifier: declaration.specifier,
        context,
      },
    );

    if (!type)
      throw new CTypeCheckError(CTypeCheckErrorCode.UNABLE_TO_EXTRACT_DECLARATION_TYPE);

    if (isNamedType(type) && !type.isRegistered()) {
      scope
        .defineType(type.name, type)
        .unwrapOrThrow();
    }

    if (initList) {
      const variables = initList.children.map(
        (initDeclarator) => extractInitDeclaratorTypeVariables(
          {
            context,
            type,
            initDeclarator,
          },
        ),
      );

      scope
        .defineVariables(variables)
        .unwrapOrThrow();
    }

    return this;
  }
}
