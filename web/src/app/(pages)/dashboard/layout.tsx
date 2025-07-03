"use client";
import React, { useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { motion } from "motion/react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Sidebar, SidebarBody } from "@/components/dashboard/sidebar";
import {
  IconChefHat,
  IconHome,
  IconMessageCircleSearch,
  IconBookmark,
  IconArrowLeft,
  IconUser,
} from "@tabler/icons-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: <IconHome className="h-5 w-5 shrink-0 text-neutral-700" />,
    },
    {
      label: "Recipe Agent",
      href: "/dashboard/chat",
      icon: (
        <IconMessageCircleSearch className="h-5 w-5 shrink-0 text-neutral-700" />
      ),
    },
    {
      label: "My Recipes",
      href: "/dashboard/my-recipes",
      icon: <IconBookmark className="h-5 w-5 shrink-0 text-neutral-700" />,
    },
  ];

  const handleLogout = async () => {
    await signOut({
      callbackUrl: "/login",
      redirect: true,
    });
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  return (
    <div className="flex h-screen w-full overflow-hidden md:flex-row flex-col">
      <Sidebar open={open} setOpen={setOpen} animate={false}>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-1 flex-col overflow-x-hidden overflow-y-auto">
            <Logo onLogoClick={() => handleNavigation("/dashboard")} />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <div
                  key={idx}
                  onClick={() => handleNavigation(link.href)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-neutral-200",
                    pathname === link.href && "bg-neutral-300"
                  )}
                >
                  {link.icon}
                  <span className="text-sm font-medium text-neutral-700">
                    {link.label}
                  </span>
                </div>
              ))}

              {/* logout button */}
              <div
                onClick={handleLogout}
                className="flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-neutral-200"
              >
                <IconArrowLeft className="h-5 w-5 shrink-0 text-neutral-700" />
                <span className="text-sm font-medium text-neutral-700">
                  Logout
                </span>
              </div>
            </div>
          </div>

          <div
            onClick={() => handleNavigation("/dashboard/account")}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-colors hover:bg-neutral-100",
              pathname === "/dashboard/account" && "bg-neutral-200"
            )}
          >
            {/* profile picture*/}
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt="Profile"
                className="h-7 w-7 shrink-0 rounded-full object-cover"
              />
            ) : (
              <IconUser className="h-7 w-7 shrink-0 rounded-full text-neutral-700" />
            )}

            {/* user name */}
            <span className="text-sm font-medium text-neutral-700 truncate">
              {session?.user?.name}
            </span>
          </div>
        </SidebarBody>
      </Sidebar>

      <div className="flex-1 w-full min-w-0">{children}</div>
    </div>
  );
}

const Logo = ({ onLogoClick }: { onLogoClick: () => void }) => {
  return (
    <div
      onClick={onLogoClick}
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black cursor-pointer"
    >
      <IconChefHat className="h-8 w-8 shrink-0 text-neutral-700" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="font-medium whitespace-pre text-black text-xl"
      >
        Sous
      </motion.span>
    </div>
  );
};
