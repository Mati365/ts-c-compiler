import {
  ASTCDeclarationSpecifier,
  ASTCDeclarator,
} from '@compiler/pico-c/frontend/parser/ast';

import {CType} from '../../../types/CType';
import {CNamedTypedEntry} from '../../../scope/variables/CNamedTypedEntry';
import {CTypeAnalyzeContext} from '../../CTypeAnalyzeContext';

type ASTCDeclarationLike = {
  specifier: ASTCDeclarationSpecifier,
  declarator?: ASTCDeclarator,
};

export type DeclaratorExtractorAttrs = {
  context: CTypeAnalyzeContext,
  type: CType,
  declarator: ASTCDeclarator,
  bitset?: number,
};

export type SpecifierResolverAttrs = {
  context: CTypeAnalyzeContext,
  specifier: ASTCDeclarationSpecifier,
};

export type TypeResolverAttrs = {
  context: CTypeAnalyzeContext,
  declaration: ASTCDeclarationLike,
};

export type TypeExtractorAttrs = Pick<TypeResolverAttrs, 'context'> & {
  extractSpecifierType(attrs: SpecifierResolverAttrs): CType,
  extractNamedEntryFromDeclarator(attrs: DeclaratorExtractorAttrs): CNamedTypedEntry,
};
