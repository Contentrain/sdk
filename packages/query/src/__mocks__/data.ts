import type { ContentrainBaseModel } from '@contentrain/types';

interface Post extends ContentrainBaseModel {
  title: string
  content: string
  categoryId: string
  scheduled: boolean
}

interface Category extends ContentrainBaseModel {
  name: string
  scheduled: boolean
}

export const mockData = {
  posts: [
    {
      ID: '1',
      title: 'Post 1',
      content: 'Content 1',
      categoryId: '1',
      status: 'publish',
      scheduled: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      ID: '2',
      title: 'Post 2',
      content: 'Content 2',
      categoryId: '2',
      status: 'draft',
      scheduled: true,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ] as Post[],
  categories: [
    {
      ID: '1',
      name: 'Category 1',
      status: 'publish',
      scheduled: false,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: '2024-01-01T00:00:00.000Z',
    },
    {
      ID: '2',
      name: 'Category 2',
      status: 'draft',
      scheduled: true,
      createdAt: '2024-01-02T00:00:00.000Z',
      updatedAt: '2024-01-02T00:00:00.000Z',
    },
  ] as Category[],
};
