import {
  Controller, Post, Body,
  UsePipes, ValidationPipe,
  Delete, Param, Get, UseInterceptors,
  ParseIntPipe, Query, DefaultValuePipe,
} from '@nestjs/common';

import {NotFoundInterceptor} from '@server/interceptors/NotFoundInterceptor';

import {CreateProjectDto} from './dto';
import {ProjectService} from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
  ) {}

  /* eslint-disable @typescript-eslint/indent */
  /**
   * Returns all projects
   *
   * @memberof ProjectController
   */
  @Get()
  index(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.projectService.findAll(
      {
        page,
        limit,
      },
    );
  }
  /* eslint-enable @typescript-eslint/indent */

  /**
   * Returns single project
   *
   * @param {number} id
   * @returns
   * @memberof ProjectController
   */
  @Get('/:id')
  @UseInterceptors(new NotFoundInterceptor('No project found for given id!'))
  get(@Param('id') id: number) {
    return this.projectService.find(id);
  }

  /**
   * Removes single project by id
   *
   * @param {number} id
   * @returns
   * @memberof ProjectController
   */
  @Delete('/:id')
  async delete(@Param('id') id: number) {
    await this.projectService.delete(id);
    return {
      success: true,
    };
  }

  /**
   * Creates single project
   *
   * @param {Response} res
   * @param {CreateProjectDto} createProjectDto
   * @memberof ProjectController
   */
  @Post()
  @UsePipes(new ValidationPipe({transform: true}))
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectService.create(createProjectDto);
  }
}
