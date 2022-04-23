import {ASTCDeclaration, ASTCCompilerKind} from '@compiler/x86-nano-c/frontend/parser/ast';
import {ASTCTypeCreator} from './ASTCTypeCreator';
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
 * @class ASTCDeclarationTypeCreator
 * @extends {ASTCTypeCreator<ASTCDeclaration>}
 */
export class ASTCDeclarationTypeCreator extends ASTCTypeCreator<ASTCDeclaration> {
  kind = ASTCCompilerKind.Declaration;

  enter(declaration: ASTCDeclaration): boolean {
    const {context, scope, analyzeVisitor} = this;
    const {initList} = declaration;

    // it returns only "int" from "int abc[3]"
    const baseType = extractSpecifierType(
      {
        specifier: declaration.specifier,
        context,
      },
    );

    if (!baseType) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNABLE_TO_EXTRACT_DECLARATION_TYPE,
        declaration.loc.start,
      );
    }

    if (isNamedType(baseType) && !baseType.isRegistered()) {
      scope
        .defineType(baseType)
        .unwrapOrThrow();
    }

    if (initList) {
      analyzeVisitor.visit(initList);

      const variables = initList.children.map((initDeclarator) => (
        // appends to "int" array size of "int abc[3]" stmt if present, so variable.type is "int[3]"
        extractInitDeclaratorTypeVariables(
          {
            type: baseType,
            context,
            initDeclarator,
          },
        )
      ));

      scope
        .defineVariables(variables)
        .unwrapOrThrow();
    }

    return false;
  }
}
