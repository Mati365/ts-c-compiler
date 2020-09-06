import {FindManyOptions, Repository} from 'typeorm';

export type PaginationOptions = {
  page?: number,
  offset?: number,
  limit: number,
};

export type PaginationResult<T> = {
  items: T[],
  meta: {
    offset: number,
    page: number,
    limit: number,
    totalItems: number,
    totalPages: number,
  },
};

/**
 * Paginate single repository
 *
 * @export
 * @template T
 * @param {Repository<T>} repo
 * @param {(FindManyOptions<T> & PaginationOptions)} {
 *     limit, page, offset,
 *     ...options
 *   }
 * @returns
 */
export async function paginate<T>(
  repo: Repository<T>,
  {
    limit, page, offset,
    ...options
  }: FindManyOptions<T> & PaginationOptions,
) {
  const [items, totalItems] = await repo.findAndCount(
    {
      ...options,
      take: Math.max(0, limit),
      skip: Math.max(0, offset ?? ((page - 1) * limit)),
    },
  );

  return {
    items,
    meta: {
      offset,
      page,
      limit,
      totalItems,
      totalPages: Math.ceil(totalItems / limit),
    },
  };
}
