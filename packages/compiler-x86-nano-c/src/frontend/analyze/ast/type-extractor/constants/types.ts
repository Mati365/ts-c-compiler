import {
  ASTCDeclarationSpecifier,
  ASTCDeclarator,
} from '@compiler/x86-nano-c/frontend/parser/ast';

import {CType} from '../../../types/CType';
import {CNamedTypedEntry} from '../../../variables/CNamedTypedEntry';
import {CAnalyzeContext} from '../../../CAnalyzeContext';

type ASTCDeclarationLike = {
  specifier: ASTCDeclarationSpecifier,
  declarator?: ASTCDeclarator,
};

export type DeclaratorExtractorAttrs = {
  context: CAnalyzeContext,
  type: CType,
  declarator: ASTCDeclarator,
  bitset?: number,
};

export type SpecifierResolverAttrs = {
  context: CAnalyzeContext,
  specifier: ASTCDeclarationSpecifier,
};

export type TypeResolverAttrs = {
  context: CAnalyzeContext,
  declaration: ASTCDeclarationLike,
};

export type TypeExtractorAttrs = Pick<TypeResolverAttrs, 'context'> & {
  extractSpecifierType(attrs: SpecifierResolverAttrs): CType,
  extractNamedEntryFromDeclarator(attrs: DeclaratorExtractorAttrs): CNamedTypedEntry,
};
