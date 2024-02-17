import { pipe } from 'fp-ts/function';
import { unwrapEitherOrThrow } from '@ts-cc/core';

import {
  ASTCFunctionDefinition,
  ASTCCompilerKind,
  ASTCBlockItemsList,
} from 'frontend/parser/ast';

import { CFunctionCallConvention } from '#constants';
import { ASTCTypeCreator } from './ASTCTypeCreator';

import { extractNamedEntryFromDeclaration } from '../../type-builder';
import { CVariable } from '../../../scope/variables/CVariable';
import { CFunctionScope } from '../../../scope/CFunctionScope';
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
      context: { currentAnalyzed, config },
    } = this;

    const fnType = this.extractFuncTypeFromNode(node);

    if (fnType) {
      const newScope = new CFunctionScope(fnType, config, node);

      unwrapEitherOrThrow(scope.defineType(fnType));

      currentAnalyzed.fnType = fnType;
      analyzeVisitor.ofScopeVisitor(scope.appendScope(newScope)).visit(fnType.definition);

      currentAnalyzed.fnType = null;

      node.type = fnType;
      node.scope = newScope;
    }

    return false;
  }

  extractFuncTypeFromNode(fnDefinition: ASTCFunctionDefinition): CFunctionDeclType {
    const { context, arch } = this;
    const { fnExpression } = fnDefinition.declarator.directDeclarator;

    const returnTypeEntry = extractNamedEntryFromDeclaration({
      skipFnExpressions: true,
      declaration: fnDefinition,
      context,
    });

    let vaList = false;
    const args = fnExpression.argsNodes.flatMap(argNode => {
      if (argNode.vaList) {
        vaList = true;
        return [];
      }

      return [
        CVariable.ofFunctionArg(
          extractNamedEntryFromDeclaration({
            declaration: argNode,
            context,
          }),
        ),
      ];
    });

    const specifier = pipe(
      CFunctionSpecifierMonad.ofParserSource(
        fnDefinition.specifier.functionSpecifiers?.items || [],
      ),
      unwrapEitherOrThrow,
    );

    const storage = pipe(
      CStorageClassMonad.ofParserSource(
        fnDefinition.specifier.storageClassSpecifiers?.items || [],
      ),
      unwrapEitherOrThrow,
    );

    return new CFunctionDeclType({
      definition: fnDefinition.content ?? new ASTCBlockItemsList(fnDefinition.loc, []),
      callConvention: CFunctionCallConvention.STDCALL,
      name: returnTypeEntry.name,
      returnType: returnTypeEntry.type,
      arch,
      args,
      storage,
      specifier,
      vaList,
    });
  }
}
