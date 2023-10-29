import { AbstractTreeVisitor } from '@ts-c-compiler/grammar';
import { CScopeTree } from './CScopeTree';

export class CScopeVisitor extends AbstractTreeVisitor<CScopeTree> {}
