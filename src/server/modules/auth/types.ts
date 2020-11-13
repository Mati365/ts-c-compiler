import {Request} from 'express';
import {UserEntity} from '../user/User.entity';

export type AuthorizedRequest = Request & {
  user?: UserEntity;
};

export type AuthTokensJSON = {
  token: string,
  refreshToken: string,
};
