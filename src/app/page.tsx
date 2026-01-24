import Link from "next/link";
import { Button } from "@/components/ui/button";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Receipt, Scale, HandCoins } from "lucide-react";

export default async function HomePage() {
  const { userId } = await auth();

  // If user is signed in, redirect to groups
  if (userId) {
    redirect("/groups");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] px-4">
      <div className="max-w-3xl text-center space-y-8">
        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
          Split expenses with friends,{" "}
          <span className="text-gradient">effortlessly</span>
        </h1>

        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Track shared expenses, see who owes whom, and get a clear settlement
          plan. No more awkward conversations or forgotten debts.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/sign-up">
            <Button size="lg" className="w-full sm:w-auto bg-[oklch(0.72_0.18_55)] hover:bg-[oklch(0.67_0.18_55)] text-white">
              Get Started Free
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline" className="w-full sm:w-auto">
              Sign In
            </Button>
          </Link>
        </div>

        <div className="pt-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <Receipt className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Track Expenses</h3>
            <p className="text-sm text-muted-foreground">
              Log shared expenses in seconds. Split equally or customize amounts.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-10 w-10 rounded-lg bg-[oklch(0.82_0.175_85/0.15)] flex items-center justify-center mb-3">
              <Scale className="h-5 w-5 text-[oklch(0.72_0.18_55)]" />
            </div>
            <h3 className="font-semibold mb-2">See Balances</h3>
            <p className="text-sm text-muted-foreground">
              Always know who owes whom with real-time balance calculations.
            </p>
          </div>
          <div className="p-6 rounded-xl border bg-card hover:shadow-lg transition-all hover:-translate-y-1">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
              <HandCoins className="h-5 w-5 text-primary" />
            </div>
            <h3 className="font-semibold mb-2">Settle Up</h3>
            <p className="text-sm text-muted-foreground">
              Get optimized payment suggestions to settle all debts easily.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
