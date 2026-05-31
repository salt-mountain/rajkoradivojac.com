export interface Photo {
  /** Path under public/, e.g. '/images/media/rajko-apiary.jpg' */
  src: string;
  /** Optional accessible description (falls back to a generic one if omitted). */
  alt?: string;
  /** Optional caption shown under the photo and in the lightbox. */
  caption?: string;
}

// Add photos here. Put the image files in `public/images/media/` and reference them
// by `/images/media/<filename>`. Title/caption is optional — a bare photo is fine:
//   { src: '/images/media/photo-1.jpg' },
//   { src: '/images/media/award.jpg', caption: 'Receiving an award, 2023' },
export const photos: Photo[] = [
  { src: '/images/media/1.jpg' },
  { src: '/images/media/2.jpg' },
  { src: '/images/media/3.jpg' },
  { src: '/images/media/4.jpg' },
  { src: '/images/media/5.jpg' },
  { src: '/images/media/6.jpg' },
  { src: '/images/media/7.jpg' },
  { src: '/images/media/8.jpg' },
];
