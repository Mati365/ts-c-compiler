import {Injectable} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {plainToClass} from 'class-transformer';

import {Tag} from './tag.entity';
import {CreateTagDto} from './dto/CreateTag.dto';

@Injectable()
export class TagService {
  constructor(
    @InjectRepository(Tag)
    private tagRepository: Repository<Tag>,
  ) {}

  /**
   * Creates single tag
   *
   * @param {CreateTagDto} dto
   * @returns {Promise<Tag>}
   * @memberof TagService
   */
  create(dto: CreateTagDto): Promise<Tag> {
    return this.tagRepository.save(dto);
  }

  /**
   * Creates array of tags
   *
   * @param {CreateTagDto[]} dto
   * @returns {Promise<Tag[]>}
   * @memberof TagService
   */
  async createListIfNotExist(dto: CreateTagDto[]): Promise<Tag[]> {
    const {tagRepository} = this;

    const r = await tagRepository
      .createQueryBuilder()
      .insert()
      .into(Tag)
      .values(dto)
      .orUpdate(
        {
          conflict_target: ['name'],
          overwrite: ['name'],
        },
      )
      .returning('*')
      .execute();

    return plainToClass(Tag, r.generatedMaps);
  }

  /**
   * Finds single tag by name
   *
   * @param {string} name
   * @returns {Promise<Tag>}
   * @memberof TagService
   */
  async findByName(name: string): Promise<Tag> {
    return this.tagRepository.findOne(
      {
        where: {
          name,
        },
      },
    );
  }
}
