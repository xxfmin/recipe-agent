import { Navbar } from "@/components/home-page/navbar";
import { Hero } from "@/components/home-page/hero";

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
    </div>
  );
}
