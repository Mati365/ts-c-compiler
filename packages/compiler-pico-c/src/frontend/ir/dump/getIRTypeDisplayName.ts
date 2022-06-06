import {CType} from '../../analyze';

export function getIRTypeDisplayName(type: CType, prefix: boolean = true) {
  return `${prefix ? ': ' : ''}${type.getShortestDisplayName()}${type.getByteSize()}B`;
}
