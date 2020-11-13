import {
  Body,
  Controller, DefaultValuePipe,
  Delete, Get, Param, ParseIntPipe, Patch,
  Post, Query, UseInterceptors, UsePipes, ValidationPipe,
} from '@nestjs/common';

import {UserScope} from '@server/constants/shared';
import {NotFoundInterceptor} from '@server/interceptors';
import {JWTScopes} from '../auth/decorators';

import {UserService} from './User.service';
import {
  CreateUserDto,
  UpdateUserDto,
} from './dto';

@Controller('users')
export class UserController {
  constructor(
    private userService: UserService,
  ) {}

  /* eslint-disable @typescript-eslint/indent */
  /**
   * Returns all users
   *
   * @memberof UserController
   */
  @Get()
  @JWTScopes(UserScope.LIST_USERS)
  index(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
    @Query('phrase') phrase: string,
  ) {
    return this.userService.findAll(
      {
        page,
        limit,
        phrase,
      },
    );
  }
  /* eslint-enable @typescript-eslint/indent */

  /**
   * Returns number of users
   *
   * @returns
   * @memberof UserController
   */
  @Get('/count')
  @JWTScopes(UserScope.LIST_USERS)
  async totalUsers() {
    return {
      count: await this.userService.count(),
    };
  }

  /**
   * Returns single user
   *
   * @param {number} id
   * @returns
   * @memberof UserController
   */
  @Get('/:id')
  @JWTScopes(UserScope.LIST_USERS)
  @UseInterceptors(new NotFoundInterceptor('No user found for given id!'))
  get(@Param('id') id: number) {
    return this.userService.find(id);
  }

  /**
   * Delete single user
   *
   * @param {number} id
   * @returns
   * @memberof UserController
   */
  @Delete('/:id')
  @JWTScopes(UserScope.DELETE_USER)
  async delete(@Param('id') id: number) {
    await this.userService.delete(id);
    return {
      success: true,
    };
  }

  /**
   * Create single user
   *
   * @param {CreateUserDto} createCategoryDto
   * @returns
   * @memberof UserController
   */
  @Post()
  @JWTScopes(UserScope.CREATE_USER)
  @UsePipes(new ValidationPipe({transform: true}))
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  /**
   * Update single user
   *
   * @param {UpdateUserDto} updateUserDto
   * @returns
   * @memberof UserController
   */
  @Patch()
  @JWTScopes(UserScope.CREATE_USER)
  @UsePipes(new ValidationPipe({transform: true}))
  update(@Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(updateUserDto);
  }
}
