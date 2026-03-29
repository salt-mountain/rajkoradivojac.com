export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverImage: string;
  amazonUrl: string;
  hasExcerpt: boolean;
  excerptDescription?: string;
  publishYear: number;
  format: string;
  price: string;
}

export const books: Book[] = [
  {
    id: 'book-1',
    title: 'Book Title One',
    subtitle: 'A Novel',
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. This compelling story draws readers into a world of vivid characters and unforgettable moments.',
    coverImage: '/images/book-1-placeholder.jpg',
    amazonUrl: 'https://www.amazon.com',
    hasExcerpt: true,
    excerptDescription: 'Read the first three chapters free',
    publishYear: 2020,
    format: 'Paperback',
    price: '$14.99',
  },
  {
    id: 'book-2',
    title: 'Book Title Two',
    subtitle: 'Stories from the Heart',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. A masterful collection that explores the depths of human experience.',
    coverImage: '/images/book-2-placeholder.jpg',
    amazonUrl: 'https://www.amazon.com',
    hasExcerpt: true,
    excerptDescription: 'Read a sample chapter free',
    publishYear: 2018,
    format: 'Hardcover',
    price: '$22.99',
  },
  {
    id: 'book-3',
    title: 'Book Title Three',
    description:
      'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo. A thought-provoking journey through time and memory.',
    coverImage: '/images/book-3-placeholder.jpg',
    amazonUrl: 'https://www.amazon.com',
    hasExcerpt: false,
    publishYear: 2015,
    format: 'Paperback',
    price: '$12.99',
  },
  {
    id: 'book-4',
    title: 'Book Title Four',
    subtitle: 'A Memoir',
    description:
      'Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt. An intimate and powerful memoir that resonates with universal truths about family, belonging, and identity.',
    coverImage: '/images/book-4-placeholder.jpg',
    amazonUrl: 'https://www.amazon.com',
    hasExcerpt: true,
    excerptDescription: 'Read the opening pages free',
    publishYear: 2012,
    format: 'Paperback',
    price: '$13.99',
  },
];
