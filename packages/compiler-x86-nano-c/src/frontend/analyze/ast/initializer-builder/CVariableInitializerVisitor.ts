import {AbstractTreeVisitor} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {CVariableInitializerTree} from '../../scope/variables';

export class CVariableInitializerVisitor extends AbstractTreeVisitor<CVariableInitializerTree> {}
