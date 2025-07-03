import Image from "next/image";

export const Hero = () => {
  return (
    <section className="h-screen w-full overflow-hidden px-8 pb-8 pt-16">
      {/* image */}
      <div className="relative h-full w-full border rounded-3xl overflow-hidden">
        <Image
          src="/home-page/hero-bg-pic.jpg"
          alt="Hero Background"
          fill
          className="object-cover"
          priority
          quality={90}
        />

        {/* dark overlay */}
        <div className="absolute inset-0 bg-black/40" />

        {/* text content */}
        <div className="absolute inset-0 flex items-end px-12 md:px-20 pb-24 md:pb-32">
          <div className="max-w-3xl">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              Welcome to Sous
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl pl-3">
              Turn ingredients into meals and cravings into reality with a
              recipe assistant that works with what you have or what you want.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
