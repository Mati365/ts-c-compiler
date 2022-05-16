import {genUUID} from '@compiler/core/utils';
import {EmitterResult} from '../constants/types/emitter';

export type EmitterLabelResult = EmitterResult & {
  uuid: string,
};

/**
 * Generates uuid and generates label
 *
 * @export
 * @param {string} [prefix='_label_']
 * @param {string} defaultUUID
 * @returns {EmitterLabelResult}
 */
export function emitLabel(prefix: string = '@@_', defaultUUID?: string): EmitterLabelResult {
  const uuid = defaultUUID || genUUID(prefix);

  return {
    code: `${uuid}:`,
    uuid,
  };
}
