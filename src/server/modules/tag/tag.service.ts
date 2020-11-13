import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Repository} from 'typeorm';
import {plainToClass} from 'class-transformer';
import * as R from 'ramda';

import {findByName} from '@server/shared/helpers/findByProp';

import {TagEntity} from './Tag.entity';
import {CreateTagDto} from './dto/CreateTag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(TagEntity)
    private tagRepository: Repository<TagEntity>,
  ) {}

  /**
   * Creates single tag
   *
   * @param {CreateTagDto} dto
   * @returns {Promise<TagEntity>}
   * @memberof TagService
   */
  create(dto: CreateTagDto): Promise<TagEntity> {
    return this.tagRepository.save(dto);
  }

  /**
   * Creates array of tags
   *
   * @param {CreateTagDto[]} dto
   * @returns {Promise<TagEntity[]>}
   * @memberof TagService
   */
  async createListIfNotExist(dto: CreateTagDto[]): Promise<TagEntity[]> {
    if (!dto?.length)
      return [];

    const {tagRepository} = this;
    let savedEntities = await tagRepository.find(
      {
        name: In(R.pluck('name', dto)),
      },
    );

    const toBeInserted = dto.reduce(
      (acc, item) => {
        if (!findByName(item.name)(savedEntities))
          acc.push(item);

        return acc;
      },
      [] as CreateTagDto[],
    );

    if (toBeInserted.length) {
      const r = await tagRepository
        .createQueryBuilder()
        .insert()
        .into(TagEntity)
        .values(toBeInserted)
        .execute();

      savedEntities = [
        ...savedEntities,
        ...plainToClass(TagEntity, r.generatedMaps),
      ];
    }

    return savedEntities;
  }

  /**
   * Finds single tag by name
   *
   * @param {string} name
   * @returns {Promise<TagEntity>}
   * @memberof TagService
   */
  async findByName(name: string): Promise<TagEntity> {
    return this.tagRepository.findOne(
      {
        where: {
          name,
        },
      },
    );
  }
}
