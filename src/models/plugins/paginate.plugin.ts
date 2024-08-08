import { z } from 'zod';
import { FilterQuery, Schema } from 'mongoose';
import { Override } from '@/interfaces/utils';
import {
  baseQueryGetListSchema,
  queryResultSchema
} from '@/schemas/utils/query-options.schema';

export type IBaseQueryOptions = z.infer<typeof baseQueryGetListSchema>;
export type IQueryResultTest = z.infer<typeof queryResultSchema>;
export type IQueryResult<T> = Override<IQueryResultTest, {
  results: T[]
}>;

const limitNum = 10;
const pageNum = 10;

export const paginate = (schema: Schema) => {
  /**
   * @typedef {Object} QueryResult
   * results - Results found
   * page - Current page
   * limit - Maximum number of results per page
   * totalPages - Total number of pages
   * totalResults - Total number of documents
   */
  /**
   * Query for documents with pagination
   * [options.sortBy] - Sorting criteria using the format: sortField:(desc|asc). Multiple sorting criteria should be separated by commas (,)
   * [options.populate] - Populate data-seed fields. Hierarchy of fields should be separated by (.). Multiple populating criteria should be separated by commas (,)
   * [options.limit] - Maximum number of results per page (default = 10)
   * [options.page] - Current page (default = 1)
   * [options.select] - Select/unselect fields ex: '-name,email' (starts with (-) will unselect name, otherwise will select)
   * @returns {Promise<QueryResult>}
   */

  schema.statics['paginate'] = async function (
    filter: FilterQuery<Schema>,
    options: IBaseQueryOptions
  ): Promise<IQueryResult<Schema>> {
    let sort = '';
    if (options.sortBy) {
      const sortingCriteria: string[] = [];
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        sortingCriteria.push((order === 'desc' ? '-' : '') + key);
      });
      sort = sortingCriteria.join(' ');
    }
    else {
      sort = '-createdAt';
    }

    const limit = options.limit &&
    parseInt(options.limit as string, limitNum) > 0 ?
      parseInt(options.limit as string, limitNum) :
      limitNum;

    const page = options.page &&
    parseInt(options.page as string, pageNum) > 0 ?
      parseInt(options.page as string, pageNum) :
      1;

    const skip = (page - 1) * limit;
    const select = options.select ? options.select.replaceAll(',', ' ') : {};

    const countPromise = this.countDocuments(filter).exec();
    let docsPromise = this.find(filter).sort(sort).skip(skip).limit(limit).select(select);

    // if (options.populate) {
    if (typeof options.populate === 'string') {
      options.populate.split(',').forEach((populateOption) => {
        if (populateOption.includes('/')) {
          const [root, subs] = populateOption.split('/');
          docsPromise.populate(
            {
              path: root,
              populate: subs.split('+').map(it => ({
                path: it,
              })),
            }
          );
          return;
        }

        docsPromise = docsPromise.populate(
          populateOption
            .split('.')
            .reverse()
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
            .reduce((a, b) => ({ path: b, populate: a }))
        );
      });
    }
    else if (typeof options.populate === 'object') {
      docsPromise = docsPromise.populate(options.populate);
    }

    docsPromise = docsPromise.lean({ virtual: true }).exec();
    // docsPromise = docsPromise.exec();

    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalResults, results] = values;
      const totalPages = Math.ceil(totalResults / limit);
      const result = {
        results,
        page,
        limit,
        totalPages,
        totalResults,
      };
      // eslint-disable-next-line promise/no-return-wrap
      return Promise.resolve(result);
    });
  };
};
