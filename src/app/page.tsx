'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Film, Users, List, Tv, ArrowRight, Sparkles } from 'lucide-react';
import { useUser } from '@/firebase';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/theme-toggle';

const retroButtonClass =
  'border-[3px] border-black rounded-lg shadow-[4px_4px_0px_0px_#000] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all duration-200';

export default function LandingPage() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  // If user is logged in and tries to access landing page, redirect to lists
  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/lists');
    }
  }, [user, isUserLoading, router]);

  // Show loading while checking auth
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Film className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  // Show landing page for unauthenticated users
  return (
    <main className="min-h-screen bg-background font-body text-foreground">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Film className="h-8 w-8 text-primary" />
            <span className="font-headline font-bold text-xl">MovieNight</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" className="font-bold">
                Log In
              </Button>
            </Link>
            <Link href="/signup">
              <Button className={retroButtonClass}>
                Sign Up
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <Film className="h-16 w-16 md:h-20 md:w-20 text-primary" />
          </div>
          <h1 className="text-5xl md:text-7xl font-headline font-bold tracking-tighter mb-6">
            MovieNight
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Your social movie watchlist. Track movies & TV shows, share lists with friends, and never forget what to watch next.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup">
              <Button size="lg" className={`${retroButtonClass} text-lg px-8 py-6`}>
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className={`${retroButtonClass} text-lg px-8 py-6`}>
                I Have an Account
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-headline font-bold text-center mb-12">
            Everything you need to plan your next watch
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-card border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000]">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 border-[2px] border-black">
                <List className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-headline font-bold text-xl mb-2">Multiple Lists</h3>
              <p className="text-muted-foreground">
                Create lists for different moods, genres, or watch parties. Keep everything organized.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-card border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000]">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 border-[2px] border-black">
                <Users className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-headline font-bold text-xl mb-2">Share with Friends</h3>
              <p className="text-muted-foreground">
                Collaborate on lists with friends. Follow others and discover new content to watch.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-card border-[3px] border-black rounded-xl p-6 shadow-[6px_6px_0px_0px_#000]">
              <div className="w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-4 border-[2px] border-black">
                <Tv className="h-6 w-6 text-primary-foreground" />
              </div>
              <h3 className="font-headline font-bold text-xl mb-2">Movies & TV Shows</h3>
              <p className="text-muted-foreground">
                Search from millions of movies and TV shows. Get ratings, cast info, and more.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof / How It Works */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="bg-secondary border-[3px] border-black rounded-xl p-8 shadow-[8px_8px_0px_0px_#000]">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
              <h3 className="font-headline font-bold text-xl">How it works</h3>
            </div>
            <ol className="space-y-4 text-lg">
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold border-[2px] border-black">
                  1
                </span>
                <span>Create an account and make your first watchlist</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold border-[2px] border-black">
                  2
                </span>
                <span>Search and add movies or TV shows you want to watch</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold border-[2px] border-black">
                  3
                </span>
                <span>Share lists with friends or invite them to collaborate</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold border-[2px] border-black">
                  4
                </span>
                <span>Track what you've watched and what's next</span>
              </li>
            </ol>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-16 mb-8">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-headline font-bold mb-6">
            Ready to start your watchlist?
          </h2>
          <p className="text-lg text-muted-foreground mb-8">
            Join MovieNight today and never lose track of what to watch next.
          </p>
          <Link href="/signup">
            <Button size="lg" className={`${retroButtonClass} text-lg px-8 py-6`}>
              Create Free Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-primary" />
              <span className="font-headline font-bold">MovieNight</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Built with love for movie enthusiasts
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
