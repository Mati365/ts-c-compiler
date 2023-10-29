import * as R from 'ramda';

import { CFunctionCallConvention } from '#constants';
import {
  ASTCAbstractDeclarator,
  ASTCCompilerKind,
  ASTCDeclarator,
  ASTCDirectDeclarator,
  ASTCDirectDeclaratorFnExpression,
} from 'frontend/parser/ast';

import type { TypeExtractorFns } from '../constants/types';
import { evalConstantExpression } from '../../expression-eval';

import {
  CTypeCheckError,
  CTypeCheckErrorCode,
} from '../../../errors/CTypeCheckError';
import { CInnerTypeTreeVisitor } from '../CInnerTypeTreeVisitor';
import { CNamedTypedEntry } from '../../../scope/variables/CNamedTypedEntry';
import { CVariable } from '../../../scope';
import { CTypeAnalyzeContext } from '../CTypeAnalyzeContext';
import {
  isArrayLikeType,
  CType,
  CPointerType,
  CArrayType,
  CFunctionDeclType,
  CStorageClassMonad,
  CFunctionSpecifierMonad,
} from '../../../types';

export type CTypeBuilderAttrs = TypeExtractorFns & {
  skipFnExpressions?: boolean;
};

/**
 * Walks over declarator related types and tries to construct type
 */
export class CTreeTypeBuilderVisitor extends CInnerTypeTreeVisitor {
  private name: string = null;

  constructor(private type: CType, private readonly attrs: CTypeBuilderAttrs) {
    super({
      [ASTCCompilerKind.AbstractDeclarator]: {
        enter: (node: ASTCAbstractDeclarator) => {
          this.extractDeclaratorPointers(node);
          this.visit(node.directAbstractDeclarator);
          return false;
        },
      },

      [ASTCCompilerKind.Declarator]: {
        enter: (node: ASTCDeclarator) => {
          this.extractDeclaratorPointers(node);
          this.visit(node.directDeclarator);
          return false;
        },
      },

      [ASTCCompilerKind.DirectDeclarator]: {
        enter: (node: ASTCDirectDeclarator) =>
          this.extractDirectDeclarator(node),
      },

      [ASTCCompilerKind.DirectDeclaratorFnExpression]: {
        enter() {
          return false;
        },
      },
    });
  }

  /**
   * Enters Declarator node
   */
  private extractDeclaratorPointers(node: ASTCDeclarator) {
    let pointerNode = node.pointer;
    while (pointerNode) {
      this.type = CPointerType.ofType(
        this.type,
        CType.qualifiersToBitset(
          pointerNode.typeQualifierList?.items,
        ).unwrapOrThrow(),
      );

      pointerNode = pointerNode.pointer;
    }
  }

  /**
   * Enters DirectDeclarator node
   */
  private extractDirectDeclarator(node: ASTCDirectDeclarator) {
    const { skipFnExpressions } = this.attrs;

    if (node.isIdentifier()) {
      this.name = this.name || node.identifier.text;
    } else if (!skipFnExpressions && node.isFnExpression()) {
      this.extractFnExpression(node.fnExpression);
      this.visit(node.directDeclarator);
      return false;
    } else if (node.isArrayExpression()) {
      const { type: baseType } = this;
      const { assignmentExpression } = node.arrayExpression;

      const size =
        assignmentExpression &&
        +evalConstantExpression({
          context: this.context,
          expression: <any>assignmentExpression,
        }).unwrapOrThrow();

      if (!R.isNil(size) && size <= 0) {
        throw new CTypeCheckError(CTypeCheckErrorCode.INVALID_ARRAY_SIZE);
      }

      if (isArrayLikeType(baseType)) {
        if (R.isNil(baseType.size) && R.isNil(size)) {
          throw new CTypeCheckError(
            CTypeCheckErrorCode.INCOMPLETE_ARRAY_SIZE,
            null,
            {
              typeName: baseType.getDisplayName(),
            },
          );
        }

        this.type = baseType.ofPrependedDimension(size);
      } else {
        this.type = new CArrayType({
          baseType,
          size,
        });
      }
    }
  }

  /**
   * Reads args list for for example function pointer
   *
   * @example
   *  int (*abc)(int, int);
   */
  private extractFnExpression(node: ASTCDirectDeclaratorFnExpression) {
    const { config } = this.context;
    const { extractNamedEntryFromDeclaration } = this.attrs;

    const abstractContext: CTypeAnalyzeContext = {
      ...this.context,
      abstract: true,
    };

    const args = node.argsNodes.map(argNode =>
      CVariable.ofFunctionArg(
        extractNamedEntryFromDeclaration({
          declaration: argNode,
          context: abstractContext,
          canBeAnonymous: true,
        }),
      ),
    );

    this.type = new CFunctionDeclType({
      callConvention: CFunctionCallConvention.STDCALL,
      name: null,
      definition: null,
      returnType: this.type,
      arch: config.arch,
      storage: CStorageClassMonad.ofBlank(),
      specifier: CFunctionSpecifierMonad.ofBlank(),
      args,
    });
  }

  getBuiltEntry() {
    const { type, name } = this;

    return new CNamedTypedEntry({
      type,
      name,
    });
  }
}
