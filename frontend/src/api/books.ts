import apiClient from './client';

export interface Book {
  id: string; // BigInt as string
  title: string;
  url: string;
  author: string;
  publisher: string;
  publish_date: string;
  price: number; // In cents/fen
  rating: number;
  cover_image: string;
  summary: string;
  tag_code: string;
  created_at: string;
}

export interface BookQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  tagCodes?: string[];
  minRating?: number;
  maxRating?: number;
  sortBy?: 'rating' | 'created_at' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface Tag {
  id: number;
  name: string;
  code: string;
  level: number;
  book_count?: number; // Backend uses snake_case in raw SQL rows usually unless mapped
  bookCount?: number;
  children?: Tag[];
}

export interface TagListResponse {
  status: string;
  data: Tag[];
}

export interface BookListResponse {
  status: string;
  data: Book[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface BookDetailResponse {
  status: string;
  data: Book;
}

export const booksApi = {
  // 获取书籍列表
  getBooks: async (params: BookQueryParams = {}): Promise<BookListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', String(params.page));
    if (params.pageSize) queryParams.append('pageSize', String(params.pageSize));
    if (params.search) queryParams.append('search', params.search);
    
    if (params.tagCodes && params.tagCodes.length > 0) {
      params.tagCodes.forEach(code => queryParams.append('tagCodes', code));
    }

    if (params.minRating !== undefined) queryParams.append('minRating', String(params.minRating));
    if (params.maxRating !== undefined) queryParams.append('maxRating', String(params.maxRating));
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const queryString = queryParams.toString();
    const url = `/crawler/books${queryString ? `?${queryString}` : ''}`;
    
    return apiClient.get(url);
  },

  // 获取分类列表 (树形)
  getCategories: async (): Promise<TagListResponse> => {
    return apiClient.get('/crawler/categories');
  },

  // 获取单本书籍详情
  getBookById: async (id: number): Promise<BookDetailResponse> => {
    return apiClient.get(`/crawler/books/${id}`);
  },
};
