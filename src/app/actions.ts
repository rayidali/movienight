'use server';

import { revalidatePath } from 'next/cache';
import type { SearchResult, UserProfile } from '@/lib/types';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { getFirebaseAdminApp } from '@/firebase/admin';

// --- HELPER ---
function getDb() {
  const adminApp = getFirebaseAdminApp();
  return getFirestore(adminApp);
}

// --- USER PROFILE ---

/**
 * Generates a unique username from email or display name.
 */
async function generateUniqueUsername(db: FirebaseFirestore.Firestore, email: string, displayName: string | null): Promise<string> {
  // Start with the part before @ in email, or displayName
  let baseUsername = displayName?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
                     email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '');

  // Ensure minimum length
  if (baseUsername.length < 3) {
    baseUsername = baseUsername + 'user';
  }

  // Check if username exists and add numbers if needed
  let username = baseUsername;
  let counter = 1;

  while (true) {
    const existing = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (existing.empty) {
      return username;
    }

    username = `${baseUsername}${counter}`;
    counter++;

    // Safety limit
    if (counter > 1000) {
      return `${baseUsername}${Date.now()}`;
    }
  }
}

/**
 * Creates a user profile and default list when a user signs up.
 */
export async function createUserProfile(userId: string, email: string, displayName: string | null) {
  const db = getDb();

  try {
    // Generate unique username
    const username = await generateUniqueUsername(db, email, displayName);

    // Create user profile document
    const userRef = db.collection('users').doc(userId);
    await userRef.set({
      uid: userId,
      email: email,
      displayName: displayName,
      photoURL: null,
      username: username,
      followersCount: 0,
      followingCount: 0,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Create default list
    const listRef = userRef.collection('lists').doc();
    await listRef.set({
      id: listRef.id,
      name: 'My Watchlist',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isDefault: true,
      isPublic: true, // Default list is public by default
      ownerId: userId,
    });

    return { success: true, defaultListId: listRef.id, username };
  } catch (error) {
    console.error('Failed to create user profile:', error);
    return { error: 'Failed to create user profile.' };
  }
}

/**
 * Ensures a user has a profile and default list (for existing users).
 * Also migrates existing users to have social fields.
 */
export async function ensureUserProfile(userId: string, email: string, displayName: string | null) {
  const db = getDb();

  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      // Create profile if it doesn't exist
      return await createUserProfile(userId, email, displayName);
    }

    // Check if user needs social fields migration
    const userData = userDoc.data();
    if (userData && (userData.username === undefined || userData.followersCount === undefined)) {
      const username = userData.username || await generateUniqueUsername(db, email, displayName);
      await userRef.update({
        username: username,
        followersCount: userData.followersCount ?? 0,
        followingCount: userData.followingCount ?? 0,
      });
    }

    // Check if user has any lists
    const listsSnapshot = await userRef.collection('lists').limit(1).get();

    if (listsSnapshot.empty) {
      // Create default list if none exist
      const listRef = userRef.collection('lists').doc();
      await listRef.set({
        id: listRef.id,
        name: 'My Watchlist',
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        isDefault: true,
        isPublic: true,
        ownerId: userId,
      });
      return { success: true, defaultListId: listRef.id };
    }

    // Find default list
    const defaultListQuery = await userRef
      .collection('lists')
      .where('isDefault', '==', true)
      .limit(1)
      .get();

    if (!defaultListQuery.empty) {
      return { success: true, defaultListId: defaultListQuery.docs[0].id };
    }

    // If no default list, use the first one
    return { success: true, defaultListId: listsSnapshot.docs[0].id };
  } catch (error) {
    console.error('Failed to ensure user profile:', error);
    return { error: 'Failed to ensure user profile.' };
  }
}

// --- LIST OPERATIONS ---

/**
 * Creates a new list for a user.
 */
export async function createList(userId: string, name: string, isPublic: boolean = true) {
  const db = getDb();

  try {
    const listRef = db.collection('users').doc(userId).collection('lists').doc();
    await listRef.set({
      id: listRef.id,
      name: name.trim(),
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      isDefault: false,
      isPublic: isPublic,
      ownerId: userId,
    });

    revalidatePath('/lists');
    return { success: true, listId: listRef.id };
  } catch (error) {
    console.error('Failed to create list:', error);
    return { error: 'Failed to create list.' };
  }
}

/**
 * Renames a list.
 */
export async function renameList(userId: string, listId: string, newName: string) {
  const db = getDb();

  try {
    const listRef = db.collection('users').doc(userId).collection('lists').doc(listId);
    await listRef.update({
      name: newName.trim(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/lists');
    revalidatePath(`/lists/${listId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to rename list:', error);
    return { error: 'Failed to rename list.' };
  }
}

/**
 * Deletes a list and all its movies.
 * Cannot delete the default list.
 */
export async function deleteList(userId: string, listId: string) {
  const db = getDb();

  try {
    const listRef = db.collection('users').doc(userId).collection('lists').doc(listId);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      return { error: 'List not found.' };
    }

    if (listDoc.data()?.isDefault) {
      return { error: 'Cannot delete your default list.' };
    }

    // Delete all movies in the list first
    const moviesSnapshot = await listRef.collection('movies').get();
    const batch = db.batch();
    moviesSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the list itself
    batch.delete(listRef);
    await batch.commit();

    revalidatePath('/lists');
    return { success: true };
  } catch (error) {
    console.error('Failed to delete list:', error);
    return { error: 'Failed to delete list.' };
  }
}

// --- MOVIE OPERATIONS ---

/**
 * Adds a movie to a specific list.
 */
export async function addMovieToList(formData: FormData) {
  const db = getDb();

  try {
    const movieData = JSON.parse(formData.get('movieData') as string) as SearchResult;
    const userId = formData.get('userId') as string;
    const listId = formData.get('listId') as string;
    const socialLink = formData.get('socialLink') as string;

    if (!movieData || !userId || !listId) {
      throw new Error('Missing movie data, user ID, or list ID.');
    }

    const movieRef = db
      .collection('users')
      .doc(userId)
      .collection('lists')
      .doc(listId)
      .collection('movies')
      .doc(movieData.id);

    await movieRef.set(
      {
        id: movieData.id,
        title: movieData.title,
        year: movieData.year,
        posterUrl: movieData.posterUrl,
        posterHint: movieData.posterHint,
        addedBy: userId,
        socialLink: socialLink || '',
        status: 'To Watch',
        createdAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Update list's updatedAt
    await db
      .collection('users')
      .doc(userId)
      .collection('lists')
      .doc(listId)
      .update({
        updatedAt: FieldValue.serverTimestamp(),
      });

    revalidatePath(`/lists/${listId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to add movie:', error);
    return { error: 'Failed to add movie.' };
  }
}

/**
 * Legacy addMovie function for backward compatibility.
 * Adds movie to user's default list.
 */
export async function addMovie(formData: FormData) {
  const db = getDb();

  try {
    const movieData = JSON.parse(formData.get('movieData') as string) as SearchResult;
    const addedBy = formData.get('addedBy') as string;
    const socialLink = formData.get('socialLink') as string;

    if (!movieData || !addedBy) {
      throw new Error('Missing movie data or user ID.');
    }

    // Find user's default list
    const listsSnapshot = await db
      .collection('users')
      .doc(addedBy)
      .collection('lists')
      .where('isDefault', '==', true)
      .limit(1)
      .get();

    let listId: string;

    if (listsSnapshot.empty) {
      // Create default list if none exists
      const result = await ensureUserProfile(addedBy, '', null);
      if ('error' in result || !result.defaultListId) {
        throw new Error('Could not find or create default list.');
      }
      listId = result.defaultListId;
    } else {
      listId = listsSnapshot.docs[0].id;
    }

    // Add movie to the default list
    const newFormData = new FormData();
    newFormData.append('movieData', JSON.stringify(movieData));
    newFormData.append('userId', addedBy);
    newFormData.append('listId', listId);
    newFormData.append('socialLink', socialLink || '');

    return await addMovieToList(newFormData);
  } catch (error) {
    console.error('Failed to add movie:', error);
    return { error: 'Failed to add movie.' };
  }
}

/**
 * Migrates movies from the old structure to a list.
 * Old: users/{userId}/movies/{movieId}
 * New: users/{userId}/lists/{listId}/movies/{movieId}
 */
export async function migrateMoviesToList(userId: string, listId: string) {
  const db = getDb();

  try {
    const oldMoviesRef = db.collection('users').doc(userId).collection('movies');
    const oldMoviesSnapshot = await oldMoviesRef.get();

    if (oldMoviesSnapshot.empty) {
      return { success: true, migratedCount: 0 };
    }

    const batch = db.batch();
    const newMoviesRef = db
      .collection('users')
      .doc(userId)
      .collection('lists')
      .doc(listId)
      .collection('movies');

    oldMoviesSnapshot.docs.forEach((doc) => {
      const movieData = doc.data();
      // Copy to new location
      batch.set(newMoviesRef.doc(doc.id), movieData);
      // Delete from old location
      batch.delete(doc.ref);
    });

    await batch.commit();

    revalidatePath('/');
    revalidatePath('/lists');
    revalidatePath(`/lists/${listId}`);

    return { success: true, migratedCount: oldMoviesSnapshot.size };
  } catch (error) {
    console.error('Failed to migrate movies:', error);
    return { error: 'Failed to migrate movies.' };
  }
}

// --- SOCIAL FEATURES ---

/**
 * Search for users by username or email.
 */
export async function searchUsers(query: string, currentUserId: string) {
  const db = getDb();

  try {
    if (!query || query.length < 2) {
      return { users: [] };
    }

    const queryLower = query.toLowerCase();

    // Search by username (prefix match)
    const usernameResults = await db.collection('users')
      .where('username', '>=', queryLower)
      .where('username', '<=', queryLower + '\uf8ff')
      .limit(10)
      .get();

    // Search by email (exact or prefix)
    const emailResults = await db.collection('users')
      .where('email', '>=', queryLower)
      .where('email', '<=', queryLower + '\uf8ff')
      .limit(10)
      .get();

    // Combine results and remove duplicates and current user
    const usersMap = new Map<string, UserProfile>();

    usernameResults.docs.forEach((doc) => {
      const data = doc.data() as UserProfile;
      if (data.uid !== currentUserId) {
        usersMap.set(data.uid, data);
      }
    });

    emailResults.docs.forEach((doc) => {
      const data = doc.data() as UserProfile;
      if (data.uid !== currentUserId && !usersMap.has(data.uid)) {
        usersMap.set(data.uid, data);
      }
    });

    const users = Array.from(usersMap.values()).slice(0, 10);

    return { users };
  } catch (error) {
    console.error('Failed to search users:', error);
    return { error: 'Failed to search users.' };
  }
}

/**
 * Get a user's profile by ID.
 */
export async function getUserProfile(userId: string) {
  const db = getDb();

  try {
    const userDoc = await db.collection('users').doc(userId).get();

    if (!userDoc.exists) {
      return { error: 'User not found.' };
    }

    return { user: userDoc.data() as UserProfile };
  } catch (error) {
    console.error('Failed to get user profile:', error);
    return { error: 'Failed to get user profile.' };
  }
}

/**
 * Get a user's profile by username.
 */
export async function getUserByUsername(username: string) {
  const db = getDb();

  try {
    const usersSnapshot = await db.collection('users')
      .where('username', '==', username.toLowerCase())
      .limit(1)
      .get();

    if (usersSnapshot.empty) {
      return { error: 'User not found.' };
    }

    return { user: usersSnapshot.docs[0].data() as UserProfile };
  } catch (error) {
    console.error('Failed to get user by username:', error);
    return { error: 'Failed to get user by username.' };
  }
}

/**
 * Update a user's username.
 */
export async function updateUsername(userId: string, newUsername: string) {
  const db = getDb();

  try {
    const username = newUsername.toLowerCase().replace(/[^a-z0-9]/g, '');

    if (username.length < 3) {
      return { error: 'Username must be at least 3 characters.' };
    }

    if (username.length > 20) {
      return { error: 'Username must be 20 characters or less.' };
    }

    // Check if username is taken
    const existing = await db.collection('users')
      .where('username', '==', username)
      .limit(1)
      .get();

    if (!existing.empty && existing.docs[0].id !== userId) {
      return { error: 'Username is already taken.' };
    }

    await db.collection('users').doc(userId).update({
      username: username,
    });

    revalidatePath('/profile');
    return { success: true, username };
  } catch (error) {
    console.error('Failed to update username:', error);
    return { error: 'Failed to update username.' };
  }
}

/**
 * Follow a user.
 */
export async function followUser(followerId: string, followingId: string) {
  const db = getDb();

  try {
    if (followerId === followingId) {
      return { error: "You can't follow yourself." };
    }

    // Check if already following
    const existingFollow = await db
      .collection('users')
      .doc(followerId)
      .collection('following')
      .doc(followingId)
      .get();

    if (existingFollow.exists) {
      return { error: 'Already following this user.' };
    }

    const batch = db.batch();

    // Add to follower's following list
    batch.set(
      db.collection('users').doc(followerId).collection('following').doc(followingId),
      {
        id: followingId,
        followerId: followerId,
        followingId: followingId,
        createdAt: FieldValue.serverTimestamp(),
      }
    );

    // Add to target's followers list
    batch.set(
      db.collection('users').doc(followingId).collection('followers').doc(followerId),
      {
        id: followerId,
        followerId: followerId,
        followingId: followingId,
        createdAt: FieldValue.serverTimestamp(),
      }
    );

    // Update counts
    batch.update(db.collection('users').doc(followerId), {
      followingCount: FieldValue.increment(1),
    });

    batch.update(db.collection('users').doc(followingId), {
      followersCount: FieldValue.increment(1),
    });

    await batch.commit();

    revalidatePath('/profile');
    revalidatePath(`/profile/${followingId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to follow user:', error);
    return { error: 'Failed to follow user.' };
  }
}

/**
 * Unfollow a user.
 */
export async function unfollowUser(followerId: string, followingId: string) {
  const db = getDb();

  try {
    const batch = db.batch();

    // Remove from follower's following list
    batch.delete(
      db.collection('users').doc(followerId).collection('following').doc(followingId)
    );

    // Remove from target's followers list
    batch.delete(
      db.collection('users').doc(followingId).collection('followers').doc(followerId)
    );

    // Update counts
    batch.update(db.collection('users').doc(followerId), {
      followingCount: FieldValue.increment(-1),
    });

    batch.update(db.collection('users').doc(followingId), {
      followersCount: FieldValue.increment(-1),
    });

    await batch.commit();

    revalidatePath('/profile');
    revalidatePath(`/profile/${followingId}`);
    return { success: true };
  } catch (error) {
    console.error('Failed to unfollow user:', error);
    return { error: 'Failed to unfollow user.' };
  }
}

/**
 * Check if a user is following another user.
 */
export async function isFollowing(followerId: string, followingId: string) {
  const db = getDb();

  try {
    const followDoc = await db
      .collection('users')
      .doc(followerId)
      .collection('following')
      .doc(followingId)
      .get();

    return { isFollowing: followDoc.exists };
  } catch (error) {
    console.error('Failed to check follow status:', error);
    return { error: 'Failed to check follow status.' };
  }
}

/**
 * Get a user's followers.
 */
export async function getFollowers(userId: string, limit: number = 50) {
  const db = getDb();

  try {
    const followersSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('followers')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    // Get user profiles for each follower
    const followerIds = followersSnapshot.docs.map((doc) => doc.id);
    const users: UserProfile[] = [];

    for (const id of followerIds) {
      const userDoc = await db.collection('users').doc(id).get();
      if (userDoc.exists) {
        users.push(userDoc.data() as UserProfile);
      }
    }

    return { users };
  } catch (error) {
    console.error('Failed to get followers:', error);
    return { error: 'Failed to get followers.' };
  }
}

/**
 * Get users that a user is following.
 */
export async function getFollowing(userId: string, limit: number = 50) {
  const db = getDb();

  try {
    const followingSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('following')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    // Get user profiles for each following
    const followingIds = followingSnapshot.docs.map((doc) => doc.id);
    const users: UserProfile[] = [];

    for (const id of followingIds) {
      const userDoc = await db.collection('users').doc(id).get();
      if (userDoc.exists) {
        users.push(userDoc.data() as UserProfile);
      }
    }

    return { users };
  } catch (error) {
    console.error('Failed to get following:', error);
    return { error: 'Failed to get following.' };
  }
}

/**
 * Get a user's public lists (for viewing by others).
 */
export async function getUserPublicLists(userId: string) {
  const db = getDb();

  try {
    const listsSnapshot = await db
      .collection('users')
      .doc(userId)
      .collection('lists')
      .where('isPublic', '==', true)
      .orderBy('updatedAt', 'desc')
      .get();

    const lists = listsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return { lists };
  } catch (error) {
    console.error('Failed to get public lists:', error);
    return { error: 'Failed to get public lists.' };
  }
}

/**
 * Get movies from a public list (for viewing by others).
 */
export async function getPublicListMovies(ownerId: string, listId: string, viewerId: string) {
  const db = getDb();

  try {
    // Check if list is public or viewer is the owner
    const listDoc = await db
      .collection('users')
      .doc(ownerId)
      .collection('lists')
      .doc(listId)
      .get();

    if (!listDoc.exists) {
      return { error: 'List not found.' };
    }

    const listData = listDoc.data();

    if (!listData?.isPublic && ownerId !== viewerId) {
      return { error: 'This list is private.' };
    }

    const moviesSnapshot = await db
      .collection('users')
      .doc(ownerId)
      .collection('lists')
      .doc(listId)
      .collection('movies')
      .orderBy('createdAt', 'desc')
      .get();

    const movies = moviesSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return {
      list: { id: listDoc.id, ...listData },
      movies,
    };
  } catch (error) {
    console.error('Failed to get public list movies:', error);
    return { error: 'Failed to get list movies.' };
  }
}

/**
 * Toggle a list's public/private status.
 */
export async function toggleListVisibility(userId: string, listId: string) {
  const db = getDb();

  try {
    const listRef = db.collection('users').doc(userId).collection('lists').doc(listId);
    const listDoc = await listRef.get();

    if (!listDoc.exists) {
      return { error: 'List not found.' };
    }

    const currentVisibility = listDoc.data()?.isPublic ?? true;
    await listRef.update({
      isPublic: !currentVisibility,
      updatedAt: FieldValue.serverTimestamp(),
    });

    revalidatePath('/lists');
    revalidatePath(`/lists/${listId}`);
    return { success: true, isPublic: !currentVisibility };
  } catch (error) {
    console.error('Failed to toggle list visibility:', error);
    return { error: 'Failed to toggle list visibility.' };
  }
}
