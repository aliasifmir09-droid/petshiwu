export interface Blog {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  petType: string;
  category: string;
  author: {
    _id: string;
    name?: string;
    email: string;
  };
  tags: string[];
  isPublished: boolean;
  publishedAt?: string;
  views: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogCategory {
  name: string;
  count: number;
}

export interface BlogFormData {
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  petType: string;
  category: string;
  tags: string;
  isPublished: boolean;
  metaTitle: string;
  metaDescription: string;
}

export interface BlogQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  petType?: string;
  category?: string;
  isPublished?: boolean;
}

export interface BlogPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface BlogsResponse {
  data: Blog[];
  pagination: BlogPagination;
}

