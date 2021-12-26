import {ASTCFunctionDefinition} from '@compiler/x86-nano-c/frontend/parser';
import {CFunctionCallConvention} from '@compiler/x86-nano-c/constants';
import {CTypeTreeVisitor} from './CTypeTreeVisitor';
import {CFunctionType, CFunctionSpecifierMonad} from '../types/function';
import {CStorageClassMonad} from '../types/parts/CFunctionStorageClassMonad';

import {extractNamedEntryFromDeclaration} from '../extractors';

/**
 * Enters function definition and analyzes its content

 * @export
 * @class CTypeFunctionVisitor
 * @extends {CTypeTreeVisitor}
 */
export class CTypeFunctionVisitor extends CTypeTreeVisitor {
  initForRootNode(node: ASTCFunctionDefinition): this {
    const fnType = this.extractFuncTypeFromNode(node);
    if (fnType)
      this.scope.defineType(fnType.name, fnType);

    return this;
  }

  /**
   * Walks over function definition node and constructs type node
   *
   * @param {ASTCStructSpecifier} structSpecifier
   * @return {CFunctionType}
   * @memberof CTypeStructVisitor
   */
  extractFuncTypeFromNode(fnDefinition: ASTCFunctionDefinition): CFunctionType {
    const {context} = this;
    const {fnExpression} = fnDefinition.declarator.directDeclarator;

    const returnTypeEntry = extractNamedEntryFromDeclaration(
      {
        declaration: fnDefinition,
        context,
      },
    );

    const args = fnExpression.argsNodes.map((argNode) => extractNamedEntryFromDeclaration(
      {
        declaration: argNode,
        context,
      },
    ));

    const specifier = (
      CFunctionSpecifierMonad
        .ofParserSource(fnDefinition.specifier.functionSpecifiers?.items || [])
        .unwrapOrThrow()
    );

    const storage = (
      CStorageClassMonad
        .ofParserSource(fnDefinition.specifier.storageClassSpecifiers?.items || [])
        .unwrapOrThrow()
    );

    return new CFunctionType(
      {
        callConvention: CFunctionCallConvention.CDECL,
        name: returnTypeEntry.name,
        returnType: returnTypeEntry.type,
        args,
        storage,
        specifier,
      },
    );
  }
}
