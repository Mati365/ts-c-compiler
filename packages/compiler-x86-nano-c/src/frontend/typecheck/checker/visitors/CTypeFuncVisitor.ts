import {ASTCFunctionDefinition} from '@compiler/x86-nano-c/frontend/parser';
import {CTypeTreeVisitor} from './CTypeTreeVisitor';
import {CFunctionType, CFunctionSpecifierMonad} from '../../types/function';
import {CStorageClassMonad} from '../../types/parts/CFunctionStorageClassMonad';
import {extractNamedFunctionReturnEntry} from '../extractors';

/**
 * Enters function definition and analyzes its content

 * @export
 * @class CTypeFuncVisitor
 * @extends {CTypeTreeVisitor}
 */
export class CTypeFuncVisitor extends CTypeTreeVisitor {
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
  extractFuncTypeFromNode(definition: ASTCFunctionDefinition): CFunctionType {
    const {context} = this;
    const returnTypeEntry = extractNamedFunctionReturnEntry(
      {
        definition,
        context,
      },
    );

    const specifier = (
      CFunctionSpecifierMonad
        .ofParserSource(definition.specifier.functionSpecifiers?.items || [])
        .unwrapOrThrow()
    );

    const storage = (
      CStorageClassMonad
        .ofParserSource(definition.specifier.storageClassSpecifiers?.items || [])
        .unwrapOrThrow()
    );

    return new CFunctionType(
      {
        name: returnTypeEntry.name,
        returnType: returnTypeEntry.type,
        args: [],
        storage,
        specifier,
      },
    );
  }
}
