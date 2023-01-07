import { CType } from '../../analyze';

export function getIRTypeDisplayName(type: CType, prefix: boolean = true) {
  if (!type) {
    return null;
  }

  const byteSize = type.getByteSize();
  return `${prefix ? ': ' : ''}${type.getShortestDisplayName()}${
    byteSize ? `${byteSize}B` : ''
  }`;
}
