import * as crypto from 'crypto';

import {Injectable, UnauthorizedException} from '@nestjs/common';
import {JwtService} from '@nestjs/jwt';

import {SafeUserJSON, UserEntity} from '../user/User.entity';
import {UserService} from '../user/User.service';
import {CreateUserDto} from '../user/dto/CreateUser.dto';
import {AuthTokensJSON} from './types';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * Creates random refresh token
   *
   * @static
   * @returns {string}
   * @memberof AuthService
   */
  static genRefreshToken(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Checks if provided name and password matches with user in db
   *
   * @param {string} name
   * @param {string} password
   * @returns {Promise<UserEntity>}
   * @memberof AuthService
   */
  async validateUser(name: string, password: string): Promise<UserEntity> {
    const user = await this.userService.findByName(name);
    if (user && user.password === user.encryptSaltedPassword(password))
      return user;

    return null;
  }

  /**
   * Creates JWT token for user
   *
   * @param {(SafeUserJSON|UserEntity)} user
   * @returns {string}
   * @memberof AuthService
   */
  signToken(user: SafeUserJSON|UserEntity): string {
    return this.jwtService.sign(
      {
        id: user.id,
        name: user.name,
        scopes: user.scopes,
      },
    );
  }

  /**
   * Regenerates user refresh token
   *
   * @param {UserEntity} user
   * @returns {AuthTokensJSON}
   * @memberof AuthService
   */
  genUserTokens(user: UserEntity): AuthTokensJSON {
    const refreshToken = AuthService.genRefreshToken();

    return {
      token: this.signToken(user),
      refreshToken,
    };
  }

  /**
   * Regenerates user refresh token
   *
   * @param {UserEntity} user
   * @returns {Promise<AuthTokensJSON>}
   * @memberof AuthService
   */
  async refreshUserToken(user: UserEntity): Promise<AuthTokensJSON> {
    const {userService} = this;
    const tokens = this.genUserTokens(user);

    await userService.update(
      {
        id: user.id,
        refreshToken: tokens.refreshToken,
      },
    );

    return tokens;
  }

  /**
   * Refresh user token using refresh token
   *
   * @param {string} refreshToken
   * @returns {Promise<AuthTokensJSON>}
   * @memberof AuthService
   */
  async refreshUserTokenByRefreshToken(refreshToken: string): Promise<AuthTokensJSON> {
    const user = await this.userService.findByRefreshToken(refreshToken);
    if (!user)
      throw new UnauthorizedException;

    return this.refreshUserToken(user);
  }

  /**
   * Creates new user and tenerates token
   *
   * @param {CreateUserDto} dto
   * @returns {Promise<AuthTokensJSON>}
   * @memberof AuthService
   */
  async registerUser(dto: CreateUserDto): Promise<AuthTokensJSON> {
    const {userService} = this;
    const user = await userService.create(dto);

    return this.refreshUserToken(user);
  }
}
