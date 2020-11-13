import {Injectable, CanActivate, ExecutionContext} from '@nestjs/common';
import {Reflector} from '@nestjs/core';

import {ENV} from '@server/constants/env';
import {UserScope} from '@server/constants/shared';
import {AuthorizedRequest} from '../types';

@Injectable()
export class ScopesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request: AuthorizedRequest = context.switchToHttp().getRequest();
    if (request.headers.authorization === ENV.token.rootUser)
      return true;

    const scopes = this.reflector.get<UserScope[]>('scopes', context.getHandler());
    if (!scopes)
      return true;

    const {user} = request;
    if (!user)
      return false;

    return ScopesGuard.hasAnyRequiredScope(
      scopes,
      user.scopes,
    );
  }

  static hasAnyRequiredScope(
    requiredScopes: readonly UserScope[],
    userScopes: readonly UserScope[],
  ) {
    return requiredScopes.some(
      (requiredScope) => userScopes.includes(requiredScope),
    );
  }
}
