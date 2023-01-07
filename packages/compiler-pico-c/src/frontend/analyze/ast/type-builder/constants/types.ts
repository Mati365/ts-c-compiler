import {
  ASTCDeclarationSpecifier,
  ASTCDeclarator,
} from '@compiler/pico-c/frontend/parser/ast';

import { CType } from '../../../types/CType';
import { CNamedTypedEntry } from '../../../scope/variables/CNamedTypedEntry';
import { CTypeAnalyzeContext } from '../CTypeAnalyzeContext';

type ASTCDeclarationLike = {
  specifier: ASTCDeclarationSpecifier;
  declarator?: ASTCDeclarator;
};

export type SpecifierResolverAttrs = {
  context: CTypeAnalyzeContext;
  specifier: ASTCDeclarationSpecifier;
};

export type TypeResolverAttrs = {
  context: CTypeAnalyzeContext;
  declaration: ASTCDeclarationLike;
  skipFnExpressions?: boolean;
  canBeAnonymous?: boolean;
};

export type DeclaratorExtractorAttrs = Omit<
  TypeResolverAttrs,
  'declaration'
> & {
  type: CType;
  declarator: ASTCDeclarator;
  bitset?: number;
};

export type TypeExtractorFns = {
  extractSpecifierType(attrs: SpecifierResolverAttrs): CType;
  extractNamedEntryFromDeclaration(attrs: TypeResolverAttrs): CNamedTypedEntry;
  extractNamedEntryFromDeclarator(
    attrs: DeclaratorExtractorAttrs,
  ): CNamedTypedEntry;
};

export type TypeExtractorAttrs = Pick<TypeResolverAttrs, 'context'> &
  TypeExtractorFns;
