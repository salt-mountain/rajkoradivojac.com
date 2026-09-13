export interface BuyLink {
  store: string;
  url: string;
}

export type BookCategory = "beekeeping" | "children" | "coloring";

export interface BookReview {
  quote: string;
  author: string;
  /** Reviewer credential / title, shown under the name. */
  title?: string;
}

export interface Book {
  id: string;
  /** Public slug used for excerpt requests + R2 keys; set on books that have an excerpt. */
  slug?: string;
  title: string;
  subtitle?: string;
  description: string;
  /** Phrase(s) in the description to bold. Defaults to the book's full title. */
  boldInDescription?: string | string[];
  coverImage: string;
  category: BookCategory;
  buyLinks: BuyLink[];
  hasExcerpt: boolean;
  excerptDescription?: string;
  inDevelopment?: boolean;
  /** Publisher name; when set, the section shows a "Published by …" badge. */
  publisher?: string;
  /** Featured review / endorsement, highlighted in the book section. */
  review?: BookReview;
}

export const books: Book[] = [
  {
    id: "book-1",
    title: "From First Hive to Honey Harvest",
    subtitle: "An Illustrated, Practical Guide for Beginners",
    description:
      "Beekeeping begins with curiosity. Confidence comes from knowing what to do, when to do it, and why. Drawing on nearly three decades of hands-on experience, Rajko Radivojac offers clear, practical guidance for those taking their first steps in beekeeping. More than 250 original photographs make essential knowledge easier to understand and apply—helping beginners make sound decisions, avoid common mistakes, care for their colonies responsibly, and develop skills they will use from their first honey harvest onward. Honest, reassuring, and grounded in real apiary work, From First Hive to Honey Harvest is a guide to keep close as questions arise and experience grows.",
    boldInDescription: ["From First Hive to Honey Harvest", "Rajko Radivojac"],
    coverImage: "/images/book-1-cover.jpg",
    category: "beekeeping",
    buyLinks: [
      {
        store: "Amazon",
        url: "https://www.amazon.com/First-Hive-Honey-Harvest/dp/1918815038/",
      },
      {
        store: "Barnes & Noble",
        url: "https://www.barnesandnoble.com/w/from-first-hive-to-honey-harvest-rajko-radivojac/1151276199",
      },
      {
        store: "Walmart",
        url: "https://www.walmart.com/ip/From-First-Hive-to-Honey-Harvest-Paperback/20941570447",
      },
    ],
    hasExcerpt: false,
    publisher: "Northern Bee Books",
    review: {
      quote:
        "There are many books available for people interested in beekeeping, but this one stands out as an excellent resource for beginners. The information is accurate, well organized, and presented in a way that is easy to read and understand. The accompanying photographs complement the text and help guide readers through each topic, making complex concepts easier to grasp. What I appreciated most was the author's honest, practical approach. He shares his extensive experience with humility and kindness, offering clear guidance that makes you feel as though you are sitting across the table having a conversation with him. I highly recommend this book to anyone who is new to beekeeping and looking for a reliable, approachable guide to getting started.",
      author: "Jennifer Berry, PhD",
      title: "Adjunct Professor, Research Professional — UGA Bee Lab",
    },
  },
  {
    id: "book-8",
    slug: "beekeeping-journal",
    title: "Beekeeping Journal",
    subtitle: "A Practical Record Book for 12 Hives",
    description:
      "Keep clear, organized records for up to 12 beehives throughout the season.\n\nThis practical beekeeping journal helps beginner and hobby beekeepers track the most important details of hive management in one simple place. With dedicated record pages for each hive, it makes it easier to document inspections, queen activity, brood pattern, colony strength, food stores, feeding, pest and disease concerns, varroa checks, treatments, harvest notes, and end-of-season observations.\n\nThe clean, easy-to-use layout is designed to help you compare hive performance, notice patterns over time, and make better beekeeping decisions throughout the year.\n\nPerfect for new beekeepers, small apiaries, and anyone who wants a simple, reliable record book for managing up to 12 hives.",
    coverImage: "/images/book-8-cover.jpg",
    category: "beekeeping",
    buyLinks: [
      { store: "Amazon", url: "https://www.amazon.com/dp/B0GZB82GP8" },
    ],
    hasExcerpt: true,
    excerptDescription: "Preview sample pages free",
  },
  {
    id: "book-2",
    slug: "beekeeping-advanced",
    title: "Pčelarstvo – Ilustrovani priručnik za napredne pčelare",
    description:
      "Beekeeping – Illustrated Manual for Advanced Beekeepers is a book published in Serbian for beekeepers who already understand the fundamentals of beekeeping and want to deepen their practical knowledge. It presents, in a clear and systematic way, the methods and technologies used in modern beekeeping, with particular attention to the production of all major bee products. Richly illustrated and grounded in real beekeeping practice, the book serves as a reliable guide for experienced beekeepers seeking greater confidence, better results, and a deeper understanding of their craft.",
    boldInDescription:
      "Beekeeping – Illustrated Manual for Advanced Beekeepers",
    coverImage: "/images/book-2-cover.jpg",
    category: "beekeeping",
    buyLinks: [],
    hasExcerpt: true,
    excerptDescription: "Read a sample chapter free",
  },
  {
    id: "book-5",
    slug: "queen-rearing",
    title: "Matica – Osmijeh na licu",
    description:
      "Matica – Smile on Your Face is a book published in Serbian for beekeepers who want to learn the practical art of queen rearing, both for the needs of their own apiary and for the market. Clear, focused, and richly illustrated with original photographs, it offers a valuable guide to one of the most important and specialized areas of modern beekeeping. Grounded in real practice, the book is designed to help beekeepers build confidence, improve results, and develop the knowledge needed for successful queen production.",
    boldInDescription: "Matica – Smile on Your Face",
    coverImage: "/images/book-5-cover.jpg",
    category: "beekeeping",
    buyLinks: [],
    hasExcerpt: true,
    excerptDescription: "Read a sample chapter free",
  },
  {
    id: "book-6",
    slug: "beekeeping-beginners",
    title: "Pčelarstvo – Ilustrovani priručnik za početnike",
    description:
      "Beekeeping – Illustrated Manual for Beginners is a book published in Serbian for those taking their first steps into the world of beekeeping. Designed as a practical introduction to bees, beekeeping equipment, and essential beekeeping work, it gives beginners a clear and accessible foundation for understanding the craft. Richly illustrated with original photographs, the book combines useful guidance with visual clarity, making it a reliable companion for new beekeepers who want to build knowledge, confidence, and good habits from the start.",
    boldInDescription: "Beekeeping – Illustrated Manual for Beginners",
    coverImage: "/images/book-6-cover.jpg",
    category: "beekeeping",
    buyLinks: [{ store: "Books2Read", url: "https://books2read.com/u/bze0Rz" }],
    hasExcerpt: true,
    excerptDescription: "Read selected poems free",
  },
  {
    id: "book-3",
    slug: "how-to-say-no",
    title: "How to Say No",
    description:
      'How to Say No is a warm and empowering picture book that helps young children understand their feelings, trust their voice, and learn that setting healthy boundaries is both important and appropriate. Through a gentle story and memorable examples, it shows children that saying "no" is not about being unkind, but about self-respect, emotional safety, and confidence. Thoughtfully designed to support early social-emotional learning, the book reflects key NAEYC-aligned values by encouraging emotional literacy, self-advocacy, and meaningful adult-child conversation.',
    coverImage: "/images/book-3-cover.jpg",
    category: "children",
    buyLinks: [
      {
        store: "Amazon",
        url: "https://www.amazon.com/How-Say-No-Children-Boundaries/dp/B0G5Y6F2W7/ref=sr_1_1?crid=28WCM87MWW0W2&dib=eyJ2IjoiMSJ9.ENXcvRIIkjXIfx_OJIUM-BeGUQFemcuAmI5sudAzoILGjHj071QN20LucGBJIEps.cQ0hUuJRsr453Eerg_OqPSY2NWgmSsX",
      },
      {
        store: "Barnes & Noble",
        url: "https://www.barnesandnoble.com/w/how-to-say-no-ray-smart/1148917731?ean=9798218884376",
      },
      {
        store: "Bookshop",
        url: "https://bookshop.org/p/books/how-to-say-no-a-gentle-story-that-helps-children-set-kind-boundaries-and-feel-safe-saying-no/e134bad992e61ba0?ean=9798218884376&next=t",
      },
    ],
    hasExcerpt: true,
    excerptDescription: "Read the opening pages free",
  },
  {
    id: "book-4",
    slug: "ray-the-smart-kitten",
    title: "The Adventure of Ray the Smart Kitten",
    description:
      "The Adventure of Ray the Smart Kitten is an educational picture book for children ages 3–7 about courage, kindness, and the joy of discovery. When Ray, a smart and curious kitten, gets lost in the forest, he meets new friends, faces unexpected challenges, and learns that bravery grows through kindness, trust, and perseverance. With its gentle storytelling and charming illustrations, the book offers young readers a warm adventure that encourages emotional growth, curiosity, and confidence.",
    coverImage: "/images/book-4-cover.jpg",
    category: "children",
    buyLinks: [
      {
        store: "Amazon",
        url: "https://www.amazon.com/gp/product/B0FHF7XS2S?ref_=dbs_m_mng_rwt_calw_tkin_0&storeType=ebooks&qid=1775395852&sr=8-1",
      },
    ],
    hasExcerpt: true,
    excerptDescription: "Read the opening pages free",
  },
  {
    id: "book-7",
    slug: "cozy-keys-to-every-room",
    title: "Cozy Keys to Every Room",
    description:
      "Unlock a world of peaceful, cozy spaces with Cozy Keys to Every Room, a relaxing coloring book for adults filled with charming rooms, decorative keys, floral details, and warm little scenes waiting to be brought to life.\n\nEach page invites you to step through a magical keyhole into a different cozy room, from quiet reading corners and dreamy bedrooms to creative studios, kitchens, gardens, and peaceful retreats. With a mix of detailed line art, elegant keys, hearts, flowers, vines, and comforting interiors, this book is designed for slow, calming coloring and creative relaxation.\n\nInside you will find:\n\n- Beautiful cozy room illustrations\n- Decorative vintage keys and keyhole-inspired designs\n- Floral borders, hearts, vines, stars, and charming details\n- Single-sided coloring pages to help reduce bleed-through\n- A color testing page to try your pencils, markers, and pens\n- Blank backing pages to help protect the next illustration\n\nThis coloring book is perfect for adults who enjoy cozy interiors, whimsical details, cottagecore-inspired art, decorative keys, floral designs, and relaxing creative time.\n\nWhether you color for stress relief, mindfulness, or simple enjoyment, Cozy Keys to Every Room offers a gentle escape into a charming world where every key opens the door to a new cozy place.",
    coverImage: "/images/book-7-cover.jpg",
    category: "coloring",
    buyLinks: [
      { store: "Amazon", url: "https://www.amazon.com/dp/B0H119B3MM" },
    ],
    hasExcerpt: true,
    excerptDescription: "Preview sample pages free",
  },
];
