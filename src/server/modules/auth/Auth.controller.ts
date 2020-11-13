import {
  Controller, Post, Body,
  UseGuards, Request,
  UsePipes, ValidationPipe,
} from '@nestjs/common';

import {UserScope} from '@server/constants/shared';
import {CreateUserDto} from '../user/dto/CreateUser.dto';
import {AuthService} from './Auth.service';
import {LocalAuthGuard} from './guards';
import {AuthorizedRequest, AuthTokensJSON} from './types';
import {RefreshUserTokenDto} from './dto/RefreshUserToken.dto';
import {Scopes} from './decorators/Scopes.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
  ) {}

  /**
   * Login user and refreshes token
   *
   * @param {AuthorizedRequest} req
   * @returns
   * @memberof AuthController
   */
  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Request() req: AuthorizedRequest) {
    const {user} = req;

    return {
      tokens: await this.authService.refreshUserToken(user),
      user,
    };
  }

  /**
   * Registers new user
   *
   * @param {CreateUserDto} createUserDto
   * @memberof AuthController
   */
  @Post('register')
  @Scopes(UserScope.CREATE_USER)
  @UsePipes(new ValidationPipe({transform: true}))
  async register(@Body() createUserDto: CreateUserDto): Promise<AuthTokensJSON> {
    return this.authService.registerUser(createUserDto);
  }

  /**
   * Refresh single user token
   *
   * @param {AuthorizedRequest} req
   * @returns {Promise<AuthTokensJSON>}
   * @memberof AuthController
   */
  @Post('refresh-token')
  @UsePipes(new ValidationPipe({transform: true}))
  async refreshToken(@Body() {refreshToken}: RefreshUserTokenDto): Promise<AuthTokensJSON> {
    return this.authService.refreshUserTokenByRefreshToken(refreshToken);
  }
}
