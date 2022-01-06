import {ASTCFunctionDefinition} from '@compiler/x86-nano-c/frontend/parser';
import {CFunctionCallConvention} from '@compiler/x86-nano-c/constants';

import {extractNamedEntryFromDeclaration} from '../type-builder';
import {CInnerTypeTreeVisitor} from '../CInnerTypeTreeVisitor';
import {
  CFunctionNode,
  CFunctionSpecifierMonad,
  CStorageClassMonad,
} from '../../scope/nodes/function';

/**
 * Enters function definition, analyzes its definition
 * and assigns meta type information to scope

 * @export
 * @class CFunctionVisitor
 * @extends {CInnerTypeTreeVisitor}
 */
export class CFunctionVisitor extends CInnerTypeTreeVisitor {
  enter(node: ASTCFunctionDefinition): boolean {
    const fn = this.extractFuncTypeFromNode(node);
    if (fn)
      this.scope.defineFunction(fn);

    return false;
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
