// This now represents the User's UID from Firebase Auth
export type User = string;

export type Movie = {
  id: string;
  title: string;
  year: string;
  posterUrl: string;
  posterHint: string;
  addedBy: User;
  socialLink?: string;
  status: 'To Watch' | 'Watched';
};

export type SearchResult = {
  id: string;
  title: string;
  year: string;
  posterUrl: string;
  posterHint: string;
};

// Type for raw TMDB API search result
export type TMDBSearchResult = {
    adult: boolean;
    backdrop_path: string | null;
    genre_ids: number[];
    id: number;
    original_language: string;
    original_title: string;
    overview: string;
    popularity: number;
    poster_path: string | null;
    release_date: string;
    title: string;
    video: boolean;
    vote_average: number;
    vote_count: number;
};
