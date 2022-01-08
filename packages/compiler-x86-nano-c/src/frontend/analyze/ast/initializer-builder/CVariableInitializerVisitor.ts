import {AbstractTreeVisitor} from '@compiler/grammar/tree/AbstractTreeVisitor';
import {CVariableInitializeValue} from '../../scope/variables';

export class CVariableInitializerVisitor extends AbstractTreeVisitor<CVariableInitializeValue> {}
