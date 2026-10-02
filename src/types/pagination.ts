export type PaginationMeta = { page: number; limit: number; total: number; totalPages: number; hasNextPage: boolean; hasPreviousPage: boolean }
export type PaginatedResponse<T> = { status: string; data: T[]; pagination: PaginationMeta }
