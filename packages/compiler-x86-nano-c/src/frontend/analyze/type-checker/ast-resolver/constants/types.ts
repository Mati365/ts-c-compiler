import {
  ASTCDeclarationSpecifier,
  ASTCDeclarator,
} from '@compiler/x86-nano-c/frontend/parser/ast';

import {CType, CNamedTypedEntry} from '../../types';
import {TypeCheckerContext} from '../../TypeCheckerContext';

type ASTCDeclarationLike = {
  specifier: ASTCDeclarationSpecifier,
  declarator?: ASTCDeclarator,
};

export type DeclaratorExtractorAttrs = {
  context: TypeCheckerContext,
  type: CType,
  declarator: ASTCDeclarator,
  bitset?: number,
};

export type SpecifierResolverAttrs = {
  context: TypeCheckerContext,
  specifier: ASTCDeclarationSpecifier,
};

export type TypeResolverAttrs = {
  context: TypeCheckerContext,
  declaration: ASTCDeclarationLike,
};

export type TypeExtractorAttrs = Pick<TypeResolverAttrs, 'context'> & {
  extractSpecifierType(attrs: SpecifierResolverAttrs): CType,
  extractNamedEntryFromDeclarator(attrs: DeclaratorExtractorAttrs): CNamedTypedEntry,
};
