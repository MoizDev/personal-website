import { Sidebar } from "@/components/Sidebar";
import { Bookshelf } from "@/components/Bookshelf";
import { Footer } from "@/components/Footer";
import { getBooks } from "@/lib/books";

export const metadata = {
  title: "bookshelf",
  description:
    "what moiz hashmi is reading — a shelf of non-fiction, fiction, and pakistani writing, with ratings.",
  alternates: { canonical: "/bookshelf" },
};

export default function BookshelfPage() {
  const books = getBooks();

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="mx-auto max-w-[1100px] px-5 pt-16 sm:px-8 sm:pt-20">
        <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-[210px_minmax(0,1fr)]">
          <Sidebar />
          <main className="pb-24 pt-2">
            <Bookshelf books={books} />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
