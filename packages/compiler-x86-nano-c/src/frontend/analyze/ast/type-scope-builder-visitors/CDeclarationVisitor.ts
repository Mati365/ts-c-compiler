import {ASTCDeclaration} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CInnerTypeTreeVisitor} from '../CInnerTypeTreeVisitor';
import {CTypeAssignVisitor} from '../type-assign-visitor/CTypeAssignVisitor';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../errors/CTypeCheckError';

import {isNamedType} from '../../utils/isNamedType';
import {
  extractInitDeclaratorTypeVariables,
  extractSpecifierType,
} from '../type-builder';

/**
 * Enters variable declaration and saves meta info about
 * type to scope context
 *
 * @export
 * @class CDeclarationVisitor
 * @extends {CInnerTypeTreeVisitor}
 */
export class CDeclarationVisitor extends CInnerTypeTreeVisitor {
  enter(declaration: ASTCDeclaration): boolean {
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
      const variables = initList.children.map((initDeclarator) => {
        const variable = extractInitDeclaratorTypeVariables(
          {
            context,
            type,
            initDeclarator,
          },
        );

        // check if initializer type matches type
        const {initializer} = variable;
        if (initializer) {
          CTypeAssignVisitor.assignTypeForNode(context, initializer);

          if (!initializer.type?.isEqual(type)) {
            throw new CTypeCheckError(
              CTypeCheckErrorCode.INITIALIZER_SIDES_TYPES_MISMATCH,
              initDeclarator.loc.start,
              {
                left: type.getShortestDisplayName() ?? '<unknown-left-expr-type>',
                right: initializer?.type?.getShortestDisplayName() ?? '<unknown-right-expr-type>',
              },
            );
          }
        }

        return variable;
      });

      scope
        .defineVariables(variables)
        .unwrapOrThrow();
    }

    return false;
  }
}
