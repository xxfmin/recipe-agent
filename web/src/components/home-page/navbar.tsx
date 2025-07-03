import { IconChefHat } from "@tabler/icons-react";
import Link from "next/link";

export const Navbar = () => {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-stone-100">
      <div className="px-16">
        <div className="flex items-center justify-between h-16">
          {/* logo */}
          <Link href="/" className="flex items-center gap-2">
            <IconChefHat className="h-10 w-10 shrink-0 text-black" />
            <h1 className="text-3xl font-semibold">Sous</h1>
          </Link>

          {/* items */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-stone-700 hover:text-gray-950">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-stone-900 text-white px-4 py-2 rounded-lg hover:bg-stone-700 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};
