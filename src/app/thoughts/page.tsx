import { Sidebar } from "@/components/Sidebar";
import { DrawerOfThoughts } from "@/components/DrawerOfThoughts";
import { Footer } from "@/components/Footer";
import { thoughtImages } from "@/lib/images";

export const metadata = {
  title: "drawer of thoughts — moiz hashmi",
};

export default function ThoughtsPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="mx-auto max-w-[1100px] px-5 pt-16 sm:px-8 sm:pt-20">
        <div className="grid grid-cols-1 gap-x-12 lg:grid-cols-[210px_minmax(0,1fr)]">
          <Sidebar />
          <main className="pb-24 pt-2">
            <DrawerOfThoughts images={thoughtImages} />
          </main>
        </div>
      </div>
      <Footer />
    </div>
  );
}
