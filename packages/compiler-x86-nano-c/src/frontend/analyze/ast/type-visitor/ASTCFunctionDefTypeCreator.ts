import {ASTCFunctionDefinition, ASTCCompilerKind} from '@compiler/x86-nano-c/frontend/parser/ast';
import {CFunctionCallConvention} from '@compiler/x86-nano-c/constants';
import {ASTCTypeCreator} from './ASTCTypeCreator';

import {extractNamedEntryFromDeclaration} from '../type-builder';
import {CVariable} from '../../scope/variables/CVariable';
import {CFunctionScope} from '../../scope/CFunctionScope';
import {
  CFunctionDeclType,
  CFunctionSpecifierMonad,
  CStorageClassMonad,
} from '../../types/function';

/**
 * Enters function definition, analyzes its definition
 * and assigns meta type information to scope
 *
 * @export
 * @class ASTCFunctionDefTypeCreator
 * @extends {ASTCTypeCreator<ASTCFunctionDefinition>}
 */
export class ASTCFunctionDefTypeCreator extends ASTCTypeCreator<ASTCFunctionDefinition> {
  kind = ASTCCompilerKind.FunctionDefinition;

  enter(node: ASTCFunctionDefinition): boolean {
    const {
      scope,
      analyzeVisitor,
      context: {
        currentAnalyzed,
        config,
      },
    } = this;

    const fnType = this.extractFuncTypeFromNode(node);

    if (fnType) {
      scope.defineType(fnType);
      currentAnalyzed.fnType = fnType;

      analyzeVisitor
        .ofScope(
          scope.appendScope(new CFunctionScope(fnType, config, node)),
        )
        .visit(fnType.definition);

      currentAnalyzed.fnType = null;
      node.type = fnType;
    }

    return false;
  }

  /**
   * Walks over function declaration type from node
   *
   * @param {ASTCStructSpecifier} structSpecifier
   * @return {CFunctionDeclType}
   * @memberof ASTCFunctionDefTypeCreator
   */
  extractFuncTypeFromNode(fnDefinition: ASTCFunctionDefinition): CFunctionDeclType {
    const {context, arch} = this;
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

    return new CFunctionDeclType(
      {
        definition: fnDefinition.content,
        callConvention: CFunctionCallConvention.CDECL,
        name: returnTypeEntry.name,
        returnType: returnTypeEntry.type,
        arch,
        args,
        storage,
        specifier,
      },
    );
  }
}
