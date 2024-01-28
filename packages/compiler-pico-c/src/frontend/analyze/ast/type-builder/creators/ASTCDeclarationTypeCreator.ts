import { unwrapEitherOrThrow } from '@ts-c-compiler/core';

import { isFuncDeclLikeType } from 'frontend/analyze/types/function/CFunctionDeclType';
import { ASTCDeclaration, ASTCCompilerKind } from 'frontend/parser/ast';
import { ASTCTypeCreator } from './ASTCTypeCreator';
import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../../errors/CTypeCheckError';

import { CTypedef } from '../../../scope/CTypedef';
import { isNamedType } from '../../../utils/isNamedType';
import {
  extractInitDeclaratorTypeVariables,
  extractSpecifierType,
} from '../extractor';

export class ASTCDeclarationTypeCreator extends ASTCTypeCreator<ASTCDeclaration> {
  kind = ASTCCompilerKind.Declaration;

  enter(declaration: ASTCDeclaration): boolean {
    if (this.context.abstract) {
      return false;
    }

    const { context, scope, analyzeVisitor } = this;
    const { initList } = declaration;

    // it returns only "int" from "int abc[3]"
    const baseType = extractSpecifierType({
      specifier: declaration.specifier,
      context,
    });

    if (!baseType) {
      throw new CTypeCheckError(
        CTypeCheckErrorCode.UNABLE_TO_EXTRACT_DECLARATION_TYPE,
        declaration.loc.start,
      );
    }

    if (isNamedType(baseType) && !baseType.isRegistered()) {
      unwrapEitherOrThrow(scope.defineType(baseType));
    }

    if (initList) {
      analyzeVisitor.visit(initList);

      const variables = initList.children.map(initDeclarator =>
        // appends to "int" array size of "int abc[3]" stmt if present, so variable.type is "int[3]"
        extractInitDeclaratorTypeVariables({
          type: baseType,
          context,
          initDeclarator,
        }),
      );

      if (declaration.specifier.storageClassSpecifiers?.isTypedef()) {
        const typedefs = variables.map(variable =>
          CTypedef.ofVariable(variable).mapType(type => type.ofRegistered()),
        );

        scope.defineTypedefs(typedefs);
      } else {
        for (const variable of variables) {
          if (isFuncDeclLikeType(variable.type)) {
            // handle int sum(int, int) without definition as function declaration
            // on the other hand treat int (*sum2)(int x, int y); as normal variable
            const fnType = variable.type.ofName(variable.name);

            scope.defineType(fnType);
          } else {
            // define normal variables such as int x, y;
            unwrapEitherOrThrow(scope.defineVariables(variables));
          }
        }
      }
    }

    return false;
  }
}
