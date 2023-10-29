/* eslint-disable import/extensions, import/no-default-export */
import { fileURLToPath } from 'node:url';
import { dirname } from 'path';
import { createJestConfig } from '../../config/jest.shared.config.mjs';

export default createJestConfig({
  rootDir: dirname(fileURLToPath(import.meta.url)),
});
