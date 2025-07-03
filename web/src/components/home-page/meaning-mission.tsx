import { BookOpen, Goal } from "lucide-react";

export const MeaningAndMission = () => {
  return (
    <div className="relative w-full max-w-6xl mx-auto bg-stone-300 backdrop-blur-md rounded-3xl p-10 shadow-xl">
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Definition Section */}
        <div className="lg:w-1/3">
          <div className="flex items-center gap-3 mb-6">
            <BookOpen className="text-zinc-600" size={24} />
            <h2 className="text-2xl font-semibold text-zinc-800">
              Sous
              <span className="text-lg font-medium text-zinc-500 ml-2">
                /so͞o/
              </span>
            </h2>
          </div>

          <p className="text-base text-zinc-700 leading-relaxed tracking-tight">
            From French <span className="italic">"sous chef"</span>, the chef's
            trusted assistant who must be versatile, creative, and equipped to
            lead.
          </p>
        </div>

        {/* Vertical Divider */}
        <div className="hidden lg:block w-px bg-stone-500 self-stretch"></div>

        {/* Mission Section */}
        <div className="lg:w-2/3">
          <div className="flex items-center gap-3 mb-6">
            <Goal className="text-zinc-600" size={24} />
            <h2 className="text-2xl font-semibold text-zinc-800">
              Our Mission
            </h2>
          </div>

          <p className="text-lg text-zinc-700 leading-relaxed tracking-tight">
            Just like a sous chef in a professional kitchen, our AI agent is
            your trusted culinary companion. We believe cooking should be
            accessible, creative, and tailored to you.
          </p>
        </div>
      </div>
    </div>
  );
};
