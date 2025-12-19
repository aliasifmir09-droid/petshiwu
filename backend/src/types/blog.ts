import { Document } from 'mongoose';
import { IUser } from '../models/User';

export interface IBlogDocument extends Document {
  _id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  petType: string;
  category: string;
  author: string | IUser;
  tags: string[];
  isPublished: boolean;
  publishedAt?: Date;
  views: number;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  toObject(): IBlogResponse;
  populate(path: string, select?: string): Promise<IBlogDocument>;
}

export interface IBlogResponse {
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

export interface IBlogQuery {
  isPublished?: boolean;
  petType?: string;
  category?: string;
  $text?: { $search: string };
  $or?: Array<{ [key: string]: { $regex: string; $options: string } }>;
}

export interface IBlogCreateData {
  title: string;
  content: string;
  excerpt?: string;
  featuredImage?: string;
  petType?: string;
  category: string;
  tags?: string[];
  isPublished?: boolean;
  metaTitle?: string;
  metaDescription?: string;
}

export interface IBlogUpdateData extends Partial<IBlogCreateData> {
  title?: string;
  content?: string;
  category?: string;
}

