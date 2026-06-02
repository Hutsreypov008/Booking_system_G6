export interface ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
    meta: {
        totalItems: number;
        itemCount: number;
        itemsPerPage: number;
        totalPages: number;
        currentPage: number;
    };
}

export const successResponse = <T>(
    message: string,
    data?: T
): ApiResponse<T> => ({
    success: true,
    message,
    data
});

export const paginatedResponse = <T>(
    message: string,
    data: T[],
    totalItems: number,
    page: number,
    limit: number
): PaginatedResponse<T> => ({
    success: true,
    message,
    data,
    meta: {
        totalItems,
        itemCount: data.length,
        itemsPerPage: limit,
        totalPages: Math.ceil(totalItems / limit),
        currentPage: page
    }
});