import {CType} from '../../analyze';

export function getIRTypeDisplayName(type: CType) {
  return `: ${type.getShortestDisplayName()}${type.getByteSize()}B`;
}
