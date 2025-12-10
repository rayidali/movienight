'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getMovies } from "@/app/actions";
import { AddMovieForm } from "@/components/add-movie-form";
import { MovieList } from "@/components/movie-list";
import { Film } from "lucide-react";
import { useUser } from '@/firebase';
import { UserAvatar } from '@/components/user-avatar';

export default function Home() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <Film className="h-12 w-12 text-primary animate-spin" />
      </div>
    );
  }

  // This is a placeholder as we will move to firestore in Phase 2
  const movies = [];

  return (
    <main className="min-h-screen bg-background font-body text-foreground">
      <div className="container mx-auto p-4 md:p-8">
        <header className="mb-12 flex flex-col items-center">
          <div className="w-full flex justify-end">
            <UserAvatar />
          </div>
          <div className="flex items-center gap-4 mb-6">
            <Film className="h-10 w-10 md:h-12 md:w-12 text-primary" />
            <h1 className="text-4xl md:text-6xl font-headline font-bold text-center tracking-tighter">
              Film Collab
            </h1>
          </div>
          <p className="max-w-2xl text-center text-muted-foreground mb-8">
            A shared movie watchlist for you and a friend. Search for a movie, add a social link, and keep track of what to watch and what you've watched.
          </p>
          <div className="w-full max-w-2xl">
            <AddMovieForm />
          </div>
        </header>

        {/* This will be re-enabled and hooked to firestore in Phase 2 */}
        {/* <MovieList initialMovies={movies} /> */}
      </div>
    </main>
  );
}
