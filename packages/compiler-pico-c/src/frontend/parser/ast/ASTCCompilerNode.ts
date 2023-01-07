import { Grammar } from '@compiler/grammar/Grammar';
import { TreeNode } from '@compiler/grammar/tree/TreeNode';
import { CCompilerIdentifier } from '@compiler/pico-c/constants';

import type { CType } from '../../analyze/types/CType';

export enum ASTCCompilerKind {
  TranslationUnit = 'TranslationUnit',

  If = 'If',
  Value = 'Value',

  EnumSpecifier = 'EnumSpecifier',
  EnumItem = 'EnumItem',

  Type = 'Type',
  TypeName = 'TypeName',
  TypeSpecifier = 'TypeSpecifier',
  AlignmentSpecifier = 'AlignmentSpecifier',
  Pointer = 'Pointer',

  Initializer = 'Initializer',
  AssignmentExpression = 'AssignmentExpression',
  Expression = 'Expression',
  ConstantExpression = 'ConstantExpression',
  UnaryExpression = 'UnaryExpression',
  IncUnaryExpression = 'IncUnaryExpression',
  DecUnaryExpression = 'DecUnaryExpression',
  SizeofUnaryExpression = 'SizeofUnaryExpression',
  CastUnaryExpression = 'CastUnaryExpression',
  CastExpression = 'CastExpression',
  PrimaryExpression = 'PrimaryExpression',
  ConditionalExpression = 'ConditionalExpression',

  PostfixExpression = 'PostfixExpression',
  PostfixArrayExpression = 'PostfixArrayExpression',
  PostfixFnExpression = 'PostfixFnExpression',
  PostfixDotExpression = 'PostfixDotExpression',
  PostfixPtrExpression = 'PostfixPtrExpression',

  Stmt = 'Stmt',
  IfStmt = 'IfStmt',
  SwitchStmt = 'SwitchStmt',
  LabelStmt = 'LabelStmt',
  CaseStmt = 'CaseStmt',
  DefaultCaseStmt = 'DefaultCaseStmt',
  WhileStmt = 'WhileStmt',
  DoWhileStmt = 'DoWhileStmt',
  ForStmt = 'ForStmt',
  GotoStmt = 'GotoStmt',
  ContinueStmt = 'ContinueStmt',
  BreakStmt = 'BreakStmt',
  ReturnStmt = 'ReturnStmt',
  ExpressionStmt = 'ExpressionStmt',

  ParameterDeclaration = 'ParameterDeclaration',
  ParameterDeclarationSpecifier = 'ParameterDeclarationSpecifier',
  StructSpecifier = 'StructSpecifier',
  UnionSpecifier = 'UnionSpecifier',

  AbstractDeclarator = 'AbstractDeclarator',
  DirectAbstractDeclarator = 'AbstractDeclarator',
  DirectAbstractDeclaratorArrayExpression = 'DirectAbstractDeclaratorArrayExpression',
  DirectAbstractDeclaratorFnExpression = 'DirectAbstractDeclaratorFnExpression',

  Declaration = 'Declaration',
  Declarator = 'Declarator',
  InitDeclarator = 'InitDeclarator',
  DirectDeclarator = 'DirectDeclarator',
  DirectDeclaratorArrayExpression = 'DirectDeclaratorArrayExpression',
  DirectDeclaratorFnExpression = 'DirectDeclaratorFnExpression',
  Designator = 'Designator',

  FunctionDefinition = 'FunctionDefinition',

  InitDeclaratorList = 'InitDeclaratorList',
  IdentifiersList = 'IdentifiersList',
  QualifiersList = 'QualifiersList',
  TypeSpecifiersList = 'TypeSpecifiersList',
  TypeQualifiersList = 'TypeQualifiersList',
  TypeSpecifiersQualifiersList = 'TypeSpecifiersQualifiersList',
  StorageClassSpecifiersList = 'StorageClassSpecifiersList',
  AlignmentSpecifiersList = 'AlignmentSpecifiersList',
  FunctionSpecifiersList = 'FunctionSpecifiersList',
  ArgumentsExpressionList = 'ArgumentsExpressionList',
  ParametersList = 'ParametersList',
  BlockItemList = 'BlockItemList',
  DeclarationsList = 'DeclarationsList',
  StructDeclarator = 'StructDeclarator',
  StructDeclaratorList = 'StructDeclaratorList',
  StructDeclarationList = 'StructDeclarationList',
  DesignatorList = 'DesignatorList',

  VariableDeclaration = 'VariableDeclaration',
  StructDeclaration = 'StructDeclaration',
  StaticAssertDeclaration = 'StaticAssertDeclaration',
  VariableDeclarator = 'VariableDeclarator',
  BinaryOperator = 'BinaryOperator',
}

export type ASTCTreeNode = TreeNode<ASTCCompilerKind>;

export class CCompilerGrammar extends Grammar<
  CCompilerIdentifier,
  ASTCCompilerKind
> {}

export class ASTCCompilerNode<
  C extends TreeNode<ASTCCompilerKind> = any,
> extends TreeNode<ASTCCompilerKind, C> {
  type?: CType;
}

export function isCompilerTreeNode(node: any): node is ASTCCompilerNode {
  return node instanceof ASTCCompilerNode;
}
