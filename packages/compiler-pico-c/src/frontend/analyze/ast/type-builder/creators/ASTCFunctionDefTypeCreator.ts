import {ASTCFunctionDefinition, ASTCCompilerKind} from '@compiler/pico-c/frontend/parser/ast';
import {CFunctionCallConvention} from '@compiler/pico-c/constants';
import {ASTCTypeCreator} from './ASTCTypeCreator';

import {extractNamedEntryFromDeclaration} from '../../type-builder';
import {CVariable} from '../../../scope/variables/CVariable';
import {CFunctionScope} from '../../../scope/CFunctionScope';
import {
  CFunctionDeclType,
  CFunctionSpecifierMonad,
  CStorageClassMonad,
} from '../../../types/function';

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
      const newScope = new CFunctionScope(fnType, config, node);

      scope
        .defineType(fnType)
        .unwrapOrThrow();

      currentAnalyzed.fnType = fnType;
      analyzeVisitor
        .ofScopeVisitor(
          scope.appendScope(newScope),
        )
        .visit(fnType.definition);

      currentAnalyzed.fnType = null;

      node.type = fnType;
      node.scope = newScope;
    }

    return false;
  }

  extractFuncTypeFromNode(fnDefinition: ASTCFunctionDefinition): CFunctionDeclType {
    const {context, arch} = this;
    const {fnExpression} = fnDefinition.declarator.directDeclarator;

    const returnTypeEntry = extractNamedEntryFromDeclaration(
      {
        skipFnExpressions: true,
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
