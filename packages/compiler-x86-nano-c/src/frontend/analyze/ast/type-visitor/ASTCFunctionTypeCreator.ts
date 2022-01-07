import {ASTCFunctionDefinition, ASTCCompilerKind} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CFunctionCallConvention} from '@compiler/x86-nano-c/constants';
import {ASTCTypeCreator} from './ASTCTypeCreator';

import {extractNamedEntryFromDeclaration} from '../type-builder';
import {CVariable} from '../../scope/variables/CVariable';
import {
  CFunctionNode,
  CFunctionSpecifierMonad,
  CStorageClassMonad,
} from '../../scope/nodes/function';

/**
 * Enters function definition, analyzes its definition
 * and assigns meta type information to scope
 *
 * @export
 * @class ASTCFunctionTypeCreator
 * @extends {ASTCTypeCreator<ASTCFunctionDefinition>}
 */
export class ASTCFunctionTypeCreator extends ASTCTypeCreator<ASTCFunctionDefinition> {
  kind = ASTCCompilerKind.FunctionDefinition;

  enter(node: ASTCFunctionDefinition): boolean {
    const {
      scope,
      analyzeVisitor,
      context: {
        currentAnalyzed,
      },
    } = this;

    const fnNode = this.extractFuncTypeFromNode(node);

    if (fnNode) {
      scope.defineFunction(fnNode);

      currentAnalyzed.fnNode = fnNode;
      analyzeVisitor.initializeScopeAndWalkTo(fnNode.innerScope, fnNode.ast);
      currentAnalyzed.fnNode = null;
    }

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
    const {context} = this;
    const {fnExpression} = fnDefinition.declarator.directDeclarator;

    const returnTypeEntry = extractNamedEntryFromDeclaration(
      {
        declaration: fnDefinition,
        context,
      },
    );

    const args = fnExpression.argsNodes.map((argNode) => CVariable.ofFunctionArg(
      extractNamedEntryFromDeclaration(
        {
          declaration: argNode,
          context,
        },
      ),
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

    return new CFunctionNode(
      {
        ast: fnDefinition.content,
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
