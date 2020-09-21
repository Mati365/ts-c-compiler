import {TreeNode} from '@compiler/grammar/tree/TreeNode';

export enum ASTCCompilerKind {
  Stmt = 'Stmt',
  Type = 'Type',
  Expression = 'Expression',
  VariableDeclaration = 'VariableDeclaration',
  VariableDeclarator = 'VariableDeclarator',
}

export class ASTCCompilerNode extends TreeNode<ASTCCompilerKind> {}
