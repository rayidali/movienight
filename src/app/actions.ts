'use server';

import { revalidatePath } from 'next/cache';
import type { SearchResult } from '@/lib/types';
import { getFirestore } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/firebase/admin';

// This is a server-side file. We use firebase-admin here.

// --- FIRESTORE SERVER ACTIONS ---

/**
 * Adds a movie to a user's list in Firestore.
 * IMPORTANT: This is a client-callable action and does not use the non-blocking helpers.
 * It's designed to be called from a form action.
 */
export async function addMovie(formData: FormData) {
  const adminApp = getFirebaseAdminApp();
  const db = getFirestore(adminApp);

  try {
    const movieData = JSON.parse(
      formData.get('movieData') as string
    ) as SearchResult;
    const addedBy = formData.get('addedBy') as string; // User ID (UID)
    const socialLink = formData.get('socialLink') as string;

    if (!movieData || !addedBy) {
      throw new Error('Missing movie data or user ID.');
    }

    const movieRef = db
      .collection('users')
      .doc(addedBy)
      .collection('movies')
      .doc(movieData.id);

    // Using `set` with `merge: true` is safe and allows creating/updating.
    await movieRef.set(
      {
        id: movieData.id,
        title: movieData.title,
        year: movieData.year,
        posterUrl: movieData.posterUrl,
        posterHint: movieData.posterHint,
        addedBy: addedBy,
        socialLink: socialLink || '',
        status: 'To Watch',
        createdAt: new Date(),
      },
      { merge: true }
    );
  } catch (error) {
    console.error('Failed to add movie:', error);
    // In a real app, you might return an error state.
    // For now, we just log it.
    return { error: 'Failed to add movie.' };
  }

  revalidatePath('/');
}
