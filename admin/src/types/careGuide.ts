export interface CareGuide {
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
  readingTime?: number;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  sections?: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  relatedProducts?: Array<{
    _id: string;
    name: string;
    slug: string;
    images?: string[];
    basePrice: number;
  }>;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CareGuideCategory {
  name: string;
  count: number;
}

export interface CareGuideFormData {
  title: string;
  content: string;
  excerpt: string;
  featuredImage: string;
  petType: string;
  category: string;
  tags: string;
  isPublished: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  sections: Array<{
    title: string;
    content: string;
    order: number;
  }>;
  relatedProducts: string[];
  metaTitle: string;
  metaDescription: string;
}

export interface CareGuideQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  petType?: string;
  category?: string;
  difficulty?: string;
  isPublished?: boolean;
}

export interface CareGuidePagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface CareGuidesResponse {
  data: CareGuide[];
  pagination: CareGuidePagination;
}

