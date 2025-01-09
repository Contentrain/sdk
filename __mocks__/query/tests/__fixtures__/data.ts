export const categories = [
  {
    ID: '1',
    name: 'Technology',
    slug: 'technology',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    status: 'publish',
    scheduled: false,
  },
  {
    ID: '2',
    name: 'Design',
    slug: 'design',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    status: 'publish',
    scheduled: false,
  },
];

export const posts = [
  {
    ID: '1',
    title: 'Getting Started with TypeScript',
    slug: 'getting-started-with-typescript',
    content: 'TypeScript is a typed superset of JavaScript...',
    categoryId: '1',
    category: categories[0],
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: '2023-01-01T00:00:00Z',
    status: 'publish',
    scheduled: false,
  },
  {
    ID: '2',
    title: 'UI Design Principles',
    slug: 'ui-design-principles',
    content: 'Learn the fundamental principles of UI design...',
    categoryId: '2',
    category: categories[1],
    createdAt: '2023-01-02T00:00:00Z',
    updatedAt: '2023-01-02T00:00:00Z',
    status: 'publish',
    scheduled: false,
  },
];
