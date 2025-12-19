export interface FAQ {
  _id: string;
  question: string;
  answer: string;
  category: string;
  petType?: string;
  order: number;
  isPublished: boolean;
  views: number;
  helpfulCount: number;
  notHelpfulCount: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface FAQCategory {
  name: string;
  count: number;
}

export interface FAQFormData {
  question: string;
  answer: string;
  category: string;
  petType?: string;
  order: number;
  isPublished: boolean;
  tags: string; // Comma-separated string for form input
}

export interface FAQQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  petType?: string;
  isPublished?: boolean;
}

export interface FAQPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface FAQsResponse {
  data: FAQ[];
  pagination: FAQPagination;
}

