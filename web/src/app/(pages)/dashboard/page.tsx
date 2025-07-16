"use client";

import Image from "next/image";
import { PopularRecipes } from "@/components/dashboard/popular-recipes";

export default function Dashboard() {
  return (
    <div className="h-screen w-full p-4 bg-gray-50">
      <div className="hidden md:grid md:grid-cols-12 md:grid-rows-8 gap-4 h-full">
        <div className="bg-white rounded-3xl col-span-4 row-span-2 col-start-1 row-start-1 shadow-sm border border-gray-100 p-4">
          1
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
                Generate recipes
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl col-span-4 row-span-4 col-start-5 row-start-1 shadow-sm border border-gray-100 p-4">
          2
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
