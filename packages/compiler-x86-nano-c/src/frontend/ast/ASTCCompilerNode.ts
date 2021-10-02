import {Grammar} from '@compiler/grammar/Grammar';
import {TreeNode} from '@compiler/grammar/tree/TreeNode';
import {CCompilerIdentifier} from '@compiler/x86-nano-c/constants';

export enum ASTCCompilerKind {
  If = 'If',
  Stmt = 'Stmt',
  Value = 'Value',
  Type = 'Type',
  PtrType = 'PtrType',
  PtrArrayType = 'PtrArrayType',
  Expression = 'Expression',
  AssignExpression = 'AssignExpression',
  Function = 'Function',
  Return = 'Return',
  VariableDeclaration = 'VariableDeclaration',
  VariableDeclarator = 'VariableDeclarator',
  BinaryOperator = 'BinaryOperator',
}

export class CCompilerGrammar extends Grammar<CCompilerIdentifier, ASTCCompilerKind> {}

export class ASTCCompilerNode extends TreeNode<ASTCCompilerKind> {}
