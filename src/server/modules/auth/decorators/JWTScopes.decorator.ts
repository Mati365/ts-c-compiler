import {applyDecorators, UseGuards} from '@nestjs/common';

import {UserScope} from '@server/constants/shared';
import {JWTAuthGuard, ScopesGuard} from '../guards';
import {Scopes} from './Scopes.decorator';

export const JWTScopes = (...scopes: UserScope[]) => applyDecorators(
  Scopes(...scopes),
  UseGuards(JWTAuthGuard, ScopesGuard),
);
