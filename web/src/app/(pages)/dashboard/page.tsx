"use client";

import Image from "next/image";
import { PopularRecipes } from "@/components/dashboard/popular-recipes";
import { useSession } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  // extract first name from full name
  const firstName = session?.user?.name?.split(" ")[0] || "there";

  const now = new Date();
  const time = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  const date = now.toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="h-screen w-full p-4 bg-gray-50">
      <div className="hidden md:grid md:grid-cols-12 md:grid-rows-8 gap-4 h-full">
        <div className="bg-white rounded-3xl col-span-4 row-span-2 col-start-1 row-start-1 shadow-sm border p-8 flex items-center h-full overflow-hidden relative">
          {/* decorative elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-orange-200/20 to-pink-200/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-gradient-to-tr from-yellow-200/20 to-orange-200/20 rounded-full blur-2xl" />

          <div className="flex items-center gap-6 w-full relative z-10">
            {/* icon bubble */}
            <div className="relative">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-6 transition-transform duration-300">
                <span className="text-3xl transform -rotate-3">👋</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-16 h-16 bg-gradient-to-br from-orange-300/30 to-pink-400/30 rounded-2xl -z-10" />
            </div>

            {/* greeting text */}
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {getGreeting()},
              </h2>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-pink-500 mb-2">
                {firstName}!
              </p>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-medium">{time}</span>
                <span className="text-gray-300">•</span>
                <span>{date}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative bg-white rounded-3xl col-span-4 row-span-6 col-start-1 row-start-3 overflow-hidden shadow-sm border border-gray-100">
          {/* fridge image */}
          <Image
            src="/dashboard/whatsinyourfridge.png"
            alt="What's in your fridge background"
            fill
            className="object-cover"
            priority
          />
          {/* content */}
          <div className="relative h-full flex items-end">
            <div className="w-full p-6 bg-gradient-to-t from-black/60 via-black/30 to-transparent">
              <h2 className="text-white text-2xl font-bold mb-4">
                What's in your fridge?
              </h2>
              <button className="bg-white text-black font-medium py-3 px-6 rounded-full hover:bg-gray-100 transition-colors">
                Find recipes
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl col-span-4 row-span-4 col-start-5 row-start-1 shadow-sm border border-gray-100 p-6 flex flex-col">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Save your recipes
          </h2>
          <p className="text-sm text-gray-500 mb-6">
            Upload photos of handwritten recipes or cookbook pages
          </p>

          {/* upload area */}
          <div className="flex-1 border-2 border-dashed border-gray-200 rounded-2xl flex flex-col items-center justify-center p-6 hover:border-gray-300 transition-colors cursor-pointer group bg-gray-50/50">
            <div className="w-16 h-16 bg-gray-900 rounded-2xl flex items-center justify-center mb-4">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 3v5a2 2 0 002 2h5"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">
              Drop your recipe image here
            </p>
            <p className="text-xs text-gray-500">or click to browse</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl col-span-4 row-span-2 col-start-9 row-start-1 p-6 flex flex-col justify-center shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">
            Find a recipe
          </h2>
          <input
            type="text"
            placeholder="e.g. pasta with chicken"
            className="w-full px-4 py-3 bg-gray-50 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-200 mb-3 border border-gray-100"
          />
          <p className="text-sm text-gray-500">
            Get recipes for any dish you want to make.
          </p>
        </div>

        <div className="bg-white rounded-3xl col-span-4 row-span-2 col-start-9 row-start-3 p-6 flex flex-col justify-center shadow-sm border border-gray-100">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">
            Have a cooking question?
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            Ask for help or get cooking tips
          </p>
          <button className="bg-black text-white font-medium py-3 px-6 rounded-lg hover:bg-gray-800 transition-colors w-fit">
            Ask question
          </button>
        </div>

        <div className="bg-white rounded-3xl col-span-8 row-span-4 col-start-5 row-start-5 shadow-sm border border-gray-100 overflow-hidden">
          <PopularRecipes />
        </div>
      </div>

      {/* mobile layout */}
      <div className="flex flex-col gap-4 md:hidden h-full">
        <div className="bg-white rounded-3xl flex-1 min-h-[160px] shadow-sm border border-gray-100 p-4">
          1
        </div>
        <div className="bg-white rounded-3xl flex-1 min-h-[120px] shadow-sm border border-gray-100 p-4">
          2
        </div>
        <div className="bg-white rounded-3xl flex-1 min-h-[120px] shadow-sm border border-gray-100 p-4">
          3
        </div>
        <div className="bg-white rounded-3xl flex-1 min-h-[180px] shadow-sm border border-gray-100 p-4">
          4
        </div>
        <div className="bg-white rounded-3xl flex-1 min-h-[200px] shadow-sm border border-gray-100 overflow-hidden">
          <PopularRecipes />
        </div>
        <div className="bg-white rounded-3xl flex-1 min-h-[160px] shadow-sm border border-gray-100 p-4">
          6
        </div>
      </div>
    </div>
  );
}
