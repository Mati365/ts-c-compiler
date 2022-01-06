import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {CNode} from './nodes/CNode';
import {IsInnerScoped} from './nodes';

export type CVisitorEntry = (IsInnerScoped & IsWalkableNode) | CNode;

export class CScopeVisitor extends AbstractTreeVisitor<CVisitorEntry> {}
