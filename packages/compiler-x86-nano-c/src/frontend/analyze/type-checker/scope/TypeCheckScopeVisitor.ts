import {AbstractTreeVisitor, IsWalkableNode} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {CNode} from '../nodes/CNode';
import {IsInnerScoped} from '../nodes';

export type TypedVisitorEntry = (IsInnerScoped & IsWalkableNode) | CNode;

export class TypeCheckScopeVisitor extends AbstractTreeVisitor<TypedVisitorEntry> {}
