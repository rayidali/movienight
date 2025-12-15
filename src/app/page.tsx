'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, ArrowRight, Popcorn } from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

const retroButtonClass =
  'border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-200';

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/lists');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Film className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen font-body text-foreground flex flex-col">
      {/* Theme toggle - top right */}
      <div className="absolute top-4 right-4 z-20">
        <ThemeToggle />
      </div>

      {/* Main content - centered splash screen style */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        {/* Logo and title */}
        <div className="flex flex-col items-center mb-8">
          <div className="bg-primary p-4 rounded-2xl border-[3px] border-black shadow-[6px_6px_0px_0px_#000] mb-6 animate-bounce-subtle">
            <Film className="h-16 w-16 text-primary-foreground" />
          </div>
          <h1 className="text-5xl md:text-6xl font-headline font-bold tracking-tighter text-center">
            MovieNight
          </h1>
        </div>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-muted-foreground text-center mb-2 max-w-md">
          Plan movie nights with friends.
        </p>
        <p className="text-base text-muted-foreground text-center mb-10 max-w-sm">
          Create shared watchlists and finally answer "what should we watch?"
        </p>

        {/* CTA Buttons - stacked for mobile feel */}
        <div className="flex flex-col gap-4 w-full max-w-xs">
          <Link href="/signup" className="w-full">
            <Button size="lg" className={`${retroButtonClass} w-full text-lg py-6 bg-primary text-primary-foreground hover:bg-primary/90`}>
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login" className="w-full">
            <Button size="lg" variant="outline" className={`${retroButtonClass} w-full text-lg py-6`}>
              I Have an Account
            </Button>
          </Link>
        </div>

        {/* Small tagline */}
        <p className="mt-8 text-sm text-muted-foreground">
          Free forever. No credit card needed.
        </p>
      </div>

      {/* Decorative popcorn at bottom */}
      <div className="pb-8 flex justify-center">
        <Popcorn className="h-8 w-8 text-warning/50 animate-bounce-subtle" />
      </div>
    </main>
  );
}
