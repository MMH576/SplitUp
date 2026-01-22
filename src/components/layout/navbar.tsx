"use client";

import Link from "next/link";
import { SignInButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center px-4 sm:px-6">
        <div className="mr-4 flex">
          <Link href="/" className="mr-4 sm:mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg sm:text-xl">SplitUp</span>
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-2 sm:space-x-4">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </SignInButton>
            <Link href="/sign-up">
              <Button size="sm">Get Started</Button>
            </Link>
          </SignedOut>

          <SignedIn>
            <Link href="/groups">
              <Button variant="ghost" size="sm">
                <span className="hidden sm:inline">My Groups</span>
                <span className="sm:hidden">Groups</span>
              </Button>
            </Link>
            <UserButton
              afterSignOutUrl="/"
              appearance={{
                elements: {
                  avatarBox: "h-8 w-8",
                },
              }}
            />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
