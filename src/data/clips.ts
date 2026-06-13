export interface Clip {
  /** MP4 URL — a site path like '/videos/foo.mp4', or an R2/CDN URL. */
  src: string;
  /** Poster image shown on the card and before playback. */
  poster: string;
  title: string;
  secondaryTitle?: string;
  /**
   * Which media filter/badge this self-hosted clip appears under. Defaults to
   * "video". Use "tv" for self-hosted TV features so they sit alongside the
   * YouTube TV entries (they still play in the in-page <video> player).
   */
  type?: "video" | "tv" | "lecture";
}

// Self-hosted videos (not YouTube). They get the "Video" filter and play in an
// in-page <video> player.
export const clips: Clip[] = [
  {
    src: "/videos/how-to-catch-a-honey-bee-swarm.mp4",
    poster: "/images/video-thumbs/swarm.jpg",
    title: "How to Catch a Honey Bee Swarm",
  },
  {
    src: "/videos/varroa-mites.mp4",
    poster: "/images/video-thumbs/varroa-mites.jpg",
    title: "Varroa Mites",
  },
  {
    src: "/videos/robbing-behavior-in-honey-bees.mp4",
    poster: "/images/video-thumbs/robbing-behavior-in-honey-bees.jpg",
    title: "Robbing Behavior in Honey Bees",
  },
  {
    src: "/videos/honeybee-swarming.mp4",
    poster: "/images/video-thumbs/honeybee-swarming.jpg",
    title: "Honeybee Swarming",
  },
  {
    src: "/videos/kiseljak-beekeepers-association-lecture.mp4",
    poster: "/images/video-thumbs/kiseljak-beekeepers-association-lecture.jpg",
    title: "Kiseljak Beekeepers Association Lecture",
    secondaryTitle: "Udruga pcelara Kiseljak - predavanje Rajka Radivojca",
    type: "tv",
  },
  {
    src: "/videos/gradiska-tv.mp4",
    poster: "/images/video-thumbs/gradiska-tv.jpg",
    title: "Gradiska TV",
    type: "tv",
  },
];
