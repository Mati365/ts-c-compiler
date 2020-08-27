import {
  Controller, Post, Body,
  UsePipes, ValidationPipe,
  Delete, Param,
} from '@nestjs/common';

import {CreateProjectDto} from './dto';
import {ProjectService} from './project.service';

@Controller('projects')
export class ProjectController {
  constructor(
    private projectService: ProjectService,
  ) {}

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
