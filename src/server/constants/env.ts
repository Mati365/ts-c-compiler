import {GLOBAL_CONFIG} from '../../../config/env';

export const ENV = {
  ...GLOBAL_CONFIG.shared,
  ...GLOBAL_CONFIG[process.env.APP_ENV || 'development'],
};
