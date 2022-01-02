import {ASTCFunctionDefinition} from '@compiler/x86-nano-c/frontend/parser';
import {CFunctionCallConvention} from '@compiler/x86-nano-c/constants';

import {extractNamedEntryFromDeclaration} from '../resolver';
import {CInnerTypeTreeVisitor} from './CInnerTypeTreeVisitor';
import {
  CFunctionNode,
  CFunctionSpecifierMonad,
  CStorageClassMonad,
} from '../../nodes/function';

/**
 * Enters function definition and analyzes its content

 * @export
 * @class CFunctionVisitor
 * @extends {CInnerTypeTreeVisitor}
 */
export class CFunctionVisitor extends CInnerTypeTreeVisitor {
  initForRootNode(node: ASTCFunctionDefinition): this {
    const fn = this.extractFuncTypeFromNode(node);
    if (fn)
      this.scope.defineFunction(fn);

    return this;
  }

  /**
   * Walks over function definition node and constructs type node
   *
   * @param {ASTCStructSpecifier} structSpecifier
   * @return {CFunctionNode}
   * @memberof CTypeStructVisitor
   */
  extractFuncTypeFromNode(fnDefinition: ASTCFunctionDefinition): CFunctionNode {
    const {context, parentVisitor} = this;
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

    const innerScope = parentVisitor.visitAndAppendScope(fnDefinition.content);

    return new CFunctionNode(
      {
        ast: fnDefinition,
        callConvention: CFunctionCallConvention.CDECL,
        name: returnTypeEntry.name,
        returnType: returnTypeEntry.type,
        innerScope,
        args,
        storage,
        specifier,
      },
    );
  }
}
