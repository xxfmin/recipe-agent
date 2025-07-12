export const MeaningAndMission = () => {
  return (
    <section className="bg-[#e8e5e0] py-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* left - modern Sous card */}
          <div className="relative max-w-md mx-auto bg-white/90 rounded-3xl shadow-xl border border-gray-200 p-10 flex flex-col items-start">
            <div className="w-10 h-1 rounded-full bg-stone-500 mb-6" />
            <h3 className="text-5xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Sous
            </h3>
            <p className="text-xl font-medium text-stone-400 mb-4">/so͞o/</p>
            <p className="text-gray-700 leading-relaxed text-lg">
              From French <em>'sous chef'</em>, the chef's trusted assistant who
              must be versatile, creative, and equipped to lead.
            </p>
          </div>

          {/* right */}
          <div className="space-y-6 text-black">
            <h2 className="text-4xl font-bold leading-tight">
              Smart, intuitive support for everyday cooking
            </h2>
            <p className="text-lg leading-relaxed text-stone-800">
              From planning to plating, Sous helps you turn what you have into
              what you crave. No stress, no guesswork, just good food made easy.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
