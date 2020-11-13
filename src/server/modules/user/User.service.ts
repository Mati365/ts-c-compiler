import {Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository, Transaction, TransactionRepository} from 'typeorm';

import {removeNullValues} from '@server/shared/removeNullValues';

import {UserScope} from '@server/constants/shared';
import {
  PaginationOptions,
  PaginationResult,
  paginateQueryBuilder,
} from '../shared/pagination';

import {UserEntity} from './User.entity';
import {UserScopeEntity} from './Scope.entity';
import {
  CreateUserDto,
  UpdateUserDto,
} from './dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  /**
   * Assigns list of scopes to user
   *
   * @param {number} id
   * @param {UserScope[]} scopes
   * @param {Repository<UserScopeEntity>} [scopeRepository]
   * @returns {Promise<void>}
   * @memberof UserService
   */
  @Transaction()
  async assignUserScopes(
    id: number,
    scopes: UserScope[],
    @TransactionRepository(UserScopeEntity) scopeRepository?: Repository<UserScopeEntity>,
  ): Promise<void> {
    await scopeRepository.delete(
      {
        userId: id,
      },
    );

    await scopeRepository.insert(
      scopes.map((scope) => new UserScopeEntity(
        {
          userId: id,
          value: scope,
        },
      )),
    );
  }

  /**
   * Return paginated array of users
   *
   * @param {PaginationOptions} options
   * @returns {Promise<PaginationResult<UserEntity>>}
   * @memberof UserService
   */
  findAll(options: PaginationOptions): Promise<PaginationResult<UserEntity>> {
    return paginateQueryBuilder(
      this
        .userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.scopesRecords', 'scopesRecords'),
      {
        ...options,
        unsafe: {
          phraseColumn: 'name',
          order: {
            'user.id': 'DESC',
          },
        },
      },
    );
  }

  /**
   * Updates single user
   *
   * @param {UpdateUserDto} dto
   * @returns
   * @memberof UserService
   */
  async update(dto: UpdateUserDto) {
    const {id, name, password, scopes, refreshToken} = dto;

    const updateResult = await this.userRepository.update(
      id,
      new UserEntity(
        removeNullValues(
          {
            name,
            password,
            refreshToken,
          },
        ),
      ),
    );

    if (scopes)
      await this.assignUserScopes(id, scopes);

    return updateResult;
  }

  /**
   * Creates single user
   *
   * @param {CreateUserDto} dto
   * @returns
   * @memberof UserService
   */
  async create({name, password, scopes}: CreateUserDto) {
    const user = await this.userRepository.save(new UserEntity(
      {
        name,
        password,
      },
    ));

    if (scopes)
      await this.assignUserScopes(user.id, scopes);

    return user;
  }

  /**
   * Remove single user
   *
   * @param {number} id
   * @memberof UserService
   */
  async delete(id: number) {
    const {userRepository} = this;
    const user = await userRepository.findOne(id);

    if (!user)
      throw new NotFoundException;

    return this.userRepository.remove(user);
  }

  /**
   * Finds single user by id
   *
   * @param {number} id
   * @returns {Promise<UserEntity>}
   * @memberof UserService
   */
  find(id: number): Promise<UserEntity> {
    return this.userRepository.findOne(id, {relations: ['scopesRecords']});
  }

  /**
   * Finds single user by name
   *
   * @param {string} name
   * @returns {Promise<UserEntity>}
   * @memberof UserService
   */
  findByName(name: string): Promise<UserEntity> {
    return this.userRepository.findOne(
      {
        relations: ['scopesRecords'],
        where: {
          name,
        },
      },
    );
  }

  /**
   * Search user by refresh token
   *
   * @param {string} token
   * @returns {Promise<UserEntity>}
   * @memberof UserService
   */
  findByRefreshToken(token: string): Promise<UserEntity> {
    return this.userRepository.findOne(
      {
        relations: ['scopesRecords'],
        where: {
          refreshToken: token,
        },
      },
    );
  }

  /**
   * Returns count of all Users
   *
   * @returns
   * @memberof UserService
   */
  count() {
    return this.userRepository.count();
  }
}
