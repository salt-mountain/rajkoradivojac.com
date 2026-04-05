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
  inDevelopment?: boolean;
}

export const books: Book[] = [
  {
    id: 'book-1',
    title: 'From First Hive to Honey Harvest',
    subtitle: 'An Illustrated, Practical Guide for Beginners',
    description:
      'From First Hive to Honey Harvest: An Illustrated, Practical Guide for Beginners is a beginner-friendly beekeeping guide that helps new beekeepers build a strong foundation before expecting their first honey harvest. Drawing on the author\'s firsthand apiary experience, the book offers clear, practical instruction on the essential early stages of beekeeping, including choosing an apiary location, obtaining healthy bees, selecting and preparing hives, understanding colony life, and managing bees through the seasons.\n\nWritten for readers with more questions than answers, the book emphasizes realistic expectations, careful observation, and steady learning rather than quick results. With more than 230 photographs supporting the instruction throughout, it provides an accessible, visually guided path from the first decision to keep bees to the knowledge and habits needed for a successful harvest.',
    coverImage: '/images/book-1-cover.jpg',
    amazonUrl: 'https://www.amazon.com',
    hasExcerpt: false,
    publishYear: 2025,
    format: 'Paperback',
    price: 'TBD',
    inDevelopment: true,
  },
  {
    id: 'book-2',
    title: 'Book Title Two',
    subtitle: 'Stories from the Heart',
    description:
      'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. A masterful collection that explores the depths of human experience.',
    coverImage: '/images/book-2-cover.jpg',
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
    coverImage: '/images/book-3-cover.jpg',
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
    coverImage: '/images/book-4-cover.jpg',
    amazonUrl: 'https://www.amazon.com',
    hasExcerpt: true,
    excerptDescription: 'Read the opening pages free',
    publishYear: 2012,
    format: 'Paperback',
    price: '$13.99',
  },
  {
    id: 'book-5',
    title: 'Book Title Five',
    subtitle: 'Essays on Life',
    description:
      'At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident. A deeply personal collection of essays that illuminates the quiet beauty of everyday existence.',
    coverImage: '/images/book-5-cover.jpg',
    amazonUrl: 'https://www.amazon.com',
    hasExcerpt: false,
    publishYear: 2009,
    format: 'Paperback',
    price: '$11.99',
  },
  {
    id: 'book-6',
    title: 'Book Title Six',
    subtitle: 'A Collection of Poetry',
    description:
      'Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. A luminous debut poetry collection that weaves together threads of heritage, longing, and hope.',
    coverImage: '/images/book-6-cover.jpg',
    amazonUrl: 'https://www.amazon.com',
    hasExcerpt: true,
    excerptDescription: 'Read selected poems free',
    publishYear: 2005,
    format: 'Hardcover',
    price: '$18.99',
  },
];
