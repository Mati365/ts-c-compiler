import {ExtractJwt, Strategy} from 'passport-jwt';
import {PassportStrategy} from '@nestjs/passport';
import {Injectable} from '@nestjs/common';

import {ENV} from '@server/constants/env';
import {SafeUserJSON} from '@server/modules/user/User.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super(
      {
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        secretOrKey: ENV.token.secret,
        ignoreExpiration: false,
      },
    );
  }

  validate(payload: any): SafeUserJSON {
    return {
      id: payload.id,
      name: payload.name,
      scopes: payload.scopes,
    };
  }
}
