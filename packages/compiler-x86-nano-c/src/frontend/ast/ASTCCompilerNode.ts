import {Grammar} from '@compiler/grammar/Grammar';
import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {CCompilerIdentifier} from '@compiler/x86-nano-c/constants';

export enum ASTCCompilerKind {
  If = 'If',
  Stmt = 'Stmt',
  Value = 'Value',
  Function = 'Function',
  Return = 'Return',

  EnumSpecifier = 'EnumSpecifier',
  EnumItem = 'EnumItem',

  Type = 'Type',
  TypeName = 'TypeName',
  TypeSpecifier = 'TypeSpecifier',
  Pointer = 'Pointer',

  Initializer = 'Initializer',
  AssignmentExpression = 'AssignmentExpression',
  Expression = 'Expression',
  ConstantExpression = 'ConstantExpression',
  AssignExpression = 'AssignExpression',
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
  PostfixDecExpression = 'PostfixDecExpression',
  PostfixIncExpression = 'PostfixIncExpression',

  ParameterDeclaration = 'ParameterDeclaration',
  ParameterDeclarationSpecifier = 'ParameterDeclarationSpecifier',

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

  InitDeclaratorList = 'InitDeclaratorList',
  IdentifiersList = 'IdentifiersList',
  QualifiersList = 'QualifiersList',
  TypeSpecifiersList = 'TypeSpecifiersList',
  TypeQualifiersList = 'TypeQualifiersList',
  StorageClassSpecifiersList = 'StorageClassSpecifiersList',
  ArgumentsExpressionList = 'ArgumentsExpressionList',
  ParametersTypedList = 'ParametersTypedList',

  VariableDeclaration = 'VariableDeclaration',
  VariableDeclarator = 'VariableDeclarator',
  BinaryOperator = 'BinaryOperator',
}

export type ASTCTreeNode = TreeNode<ASTCCompilerKind>;

export class CCompilerGrammar extends Grammar<CCompilerIdentifier, ASTCCompilerKind> {}

export class ASTCCompilerNode extends TreeNode<ASTCCompilerKind> {}
