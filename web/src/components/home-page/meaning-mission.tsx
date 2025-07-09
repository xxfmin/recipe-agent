export const MeaningAndMission = () => {
  return (
    <section className="bg-[#e8e5e0] py-16">
      <div className="max-w-6xl mx-auto px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          {/* left */}
          <div className="relative max-w-md mx-auto bg-black rounded-3xl shadow-xl p-8">
            <h3 className="text-4xl font-semibold text-white mb-2">Sous</h3>
            <p className="italic text-stone-300 mb-4">/so͞o/</p>
            <p className="text-stone-200 leading-relaxed">
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
