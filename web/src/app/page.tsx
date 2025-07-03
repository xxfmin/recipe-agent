import { Navbar } from "@/components/home-page/navbar";
import { Hero } from "@/components/home-page/hero";
import { MeaningAndMission } from "@/components/home-page/meaning-mission";

export default function Home() {
  return (
    <div className="min-h-screen bg-stone-100 ">
      <Navbar />
      <Hero />
      <div className="max-w-6xl mx-auto py-16 px-8 space-y-8">
        <MeaningAndMission />
      </div>
    </div>
  );
}
