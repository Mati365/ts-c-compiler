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
  TypeSpecifier = 'TypeSpecifier',
  PtrType = 'PtrType',
  PtrArrayType = 'PtrArrayType',

  Expression = 'Expression',
  ConstantExpression = 'ConstantExpression',
  AssignExpression = 'AssignExpression',

  VariableDeclaration = 'VariableDeclaration',
  VariableDeclarator = 'VariableDeclarator',
  BinaryOperator = 'BinaryOperator',
}

export type ASTCTreeNode = TreeNode<ASTCCompilerKind>;

export class CCompilerGrammar extends Grammar<CCompilerIdentifier, ASTCCompilerKind> {}

export class ASTCCompilerNode extends TreeNode<ASTCCompilerKind> {}
