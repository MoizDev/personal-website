// The bookshelf. Covers live in /public/covers/<slug>.jpg — add a book here and
// drop a matching cover image in that folder.
export type BookStatus = "read" | "reading" | "to-read";

export type Book = {
  slug: string;
  title: string;
  author: string;
  status: BookStatus;
  /** 0–5; only shown for read books */
  rating?: number;
  /** highlighted at the top of the shelf */
  featured?: boolean;
  note?: string;
};

export const books: Book[] = [
  {
    slug: "pakistan-a-personal-history",
    title: "Pakistan: A Personal History",
    author: "Imran Khan",
    status: "read",
    rating: 5,
    featured: true,
    note: "part memoir, part nation. the book that made me read my own country's story instead of inheriting it secondhand.",
  },

  // non-fiction
  { slug: "100m-offers", title: "$100M Offers", author: "Alex Hormozi", status: "read", rating: 5 },
  { slug: "100m-leads", title: "$100M Leads", author: "Alex Hormozi", status: "read", rating: 4 },
  { slug: "atomic-habits", title: "Atomic Habits", author: "James Clear", status: "read", rating: 5 },
  { slug: "deep-work", title: "Deep Work", author: "Cal Newport", status: "reading" },
  { slug: "thinking-in-systems", title: "Thinking in Systems", author: "Donella Meadows", status: "to-read" },

  // fiction
  { slug: "the-kite-runner", title: "The Kite Runner", author: "Khaled Hosseini", status: "read", rating: 5 },
  { slug: "norwegian-wood", title: "Norwegian Wood", author: "Haruki Murakami", status: "read", rating: 4 },
  { slug: "project-hail-mary", title: "Project Hail Mary", author: "Andy Weir", status: "reading" },

  // pakistan / political
  { slug: "the-reluctant-fundamentalist", title: "The Reluctant Fundamentalist", author: "Mohsin Hamid", status: "read", rating: 4 },
  { slug: "a-case-of-exploding-mangoes", title: "A Case of Exploding Mangoes", author: "Mohammed Hanif", status: "read", rating: 4 },
  { slug: "moth-smoke", title: "Moth Smoke", author: "Mohsin Hamid", status: "read", rating: 4 },
  { slug: "the-struggle-for-pakistan", title: "The Struggle for Pakistan", author: "Ayesha Jalal", status: "to-read" },
];

export type BookWithCover = Book & { cover: string };

export function getBooks(): BookWithCover[] {
  return books.map((b) => ({ ...b, cover: `/covers/${b.slug}.jpg` }));
}
