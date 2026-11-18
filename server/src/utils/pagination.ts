export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResult<T> {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
  data: T[];
}

export function parsePaginationParams(query: Record<string, any>): PaginationParams {
  const parsedPage = parseInt(query.page as string, 10);
  const parsedLimit = parseInt(query.limit as string, 10);

  const page = !isNaN(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const rawLimit = !isNaN(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
  const limit = Math.min(rawLimit, 100); // Guard against unbounded limit
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginatedResponse<T>(
  data: T[],
  totalCount: number,
  page: number,
  limit: number
): PaginatedResult<T> {
  const totalPages = Math.ceil(totalCount / limit) || 1;
  return {
    page,
    limit,
    totalCount,
    totalPages,
    data,
  };
}
