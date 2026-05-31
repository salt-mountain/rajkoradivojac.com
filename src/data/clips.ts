export interface Clip {
  /** MP4 URL — a site path like '/videos/foo.mp4', or an R2/CDN URL. */
  src: string;
  /** Poster image shown on the card and before playback. */
  poster: string;
  title: string;
  secondaryTitle?: string;
}

// Self-hosted videos (not YouTube). They get the "Video" filter and play in an
// in-page <video> player.
export const clips: Clip[] = [
  {
    src: '/videos/how-to-catch-a-honey-bee-swarm.mp4',
    poster: '/images/video-thumbs/swarm.jpg',
    title: 'How to Catch a Honey Bee Swarm',
  },
];
