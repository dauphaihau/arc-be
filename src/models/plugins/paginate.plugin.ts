import { z } from 'zod';
import { FilterQuery, Schema } from 'mongoose';
import {
  baseQueryOptionsSchema,
  queryResultSchema
} from '@/schema/sub/queryOptions.schema';

export type IBaseQueryOptions = z.infer<typeof baseQueryOptionsSchema>;
export type IQueryResult = z.infer<typeof queryResultSchema>;

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
   * [options.populate] - Populate data fields. Hierarchy of fields should be separated by (.). Multiple populating criteria should be separated by commas (,)
   * [options.limit] - Maximum number of results per page (default = 10)
   * [options.page] - Current page (default = 1)
   * [options.select] - Select/unselect fields ex: '-name,email' (starts with (-) will unselect name, otherwise will select)
   * @returns {Promise<QueryResult>}
   */

  schema.statics['paginate'] = async function (
    filter: FilterQuery<Schema>,
    options: IBaseQueryOptions
  ): Promise<IQueryResult> {
    let sort = '';
    if (options.sortBy) {
      const sortingCriteria: string[] = [];
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':');
        sortingCriteria.push((order === 'desc' ? '-' : '') + key);
      });
      sort = sortingCriteria.join(' ');
    } else {
      sort = 'createdAt';
    }

    const limit = options.limit &&
    parseInt(options.limit as string, 10) > 0 ?
      parseInt(options.limit as string, 10) :
      10;

    const page = options.page &&
    parseInt(options.page as string, 10) > 0 ?
      parseInt(options.page as string, 10) :
      1;

    const skip = (page - 1) * limit;
    const select = options.select ? options.select.replaceAll(',', ' ') : {};


    const countPromise = this.countDocuments(filter).exec();
    let docsPromise = this.find(filter).sort(sort).skip(skip).limit(limit).select(select);

    if (options.populate) {
      options.populate.split(',').forEach((populateOption) => {
        docsPromise = docsPromise.populate(
          populateOption
          // populateOption
          //   .split('.')
          //   .reverse()
          //   .reduce((a, b) => ({ path: b, populate: a }))
        );
      });
    }

    docsPromise = docsPromise.exec();

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
