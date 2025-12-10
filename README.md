# MovieNight 🎬

A social movie watchlist app for friends to curate and share movies together. Create collaborative lists, save the TikTok/Reel that made you want to watch something, and track your movie journey with friends.

## Vision

Ever seen a movie recommendation on TikTok and forgot to save it? MovieNight lets you:
- Create multiple watchlists with custom names
- Save the social media link (TikTok, Instagram Reel, YouTube Short) that inspired you
- Collaborate with up to 3 friends on shared lists
- Track what's "To Watch" vs "Watched"
- Follow friends and discover what they're watching

## Current Features

- **User Authentication**: Sign up/login with Firebase Auth
- **Movie Search**: Find any movie using TMDB API
- **Personal Watchlist**: Add movies with To Watch / Watched status
- **Social Links**: Attach TikTok/Instagram links to movies

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **Styling**: Tailwind CSS & shadcn/ui
- **Movie Data**: TMDB API

---

## Development Roadmap

### Phase 1: Multiple Lists & User Profiles
**Goal**: Let users create multiple named watchlists

- [ ] Create user profile document on signup
- [ ] "My Lists" page showing all user's lists
- [ ] Create new list with custom name
- [ ] Each list has its own To Watch / Watched tabs
- [ ] Delete/rename lists
- [ ] Migrate existing movies to a "Default" list

**Database Changes**:
```
users/{userId}
  - displayName, email, photoURL, createdAt

users/{userId}/lists/{listId}
  - name: "Weekend Binges"
  - createdAt: timestamp
  - isCollaborative: false

users/{userId}/lists/{listId}/movies/{movieId}
  - title, year, posterUrl, status, socialLink, addedAt
```

---

### Phase 2: Enhanced Movie Cards & Video Embeds
**Goal**: Expandable cards that play the linked TikTok/Reel/Short

- [ ] Click movie card to expand (modal or drawer)
- [ ] Expanded view shows: large poster, title, year, description
- [ ] Embedded video player for TikTok/Instagram/YouTube
- [ ] Video auto-plays in loop when expanded
- [ ] Video pauses when card is closed
- [ ] Improve social link input (detect platform, validate URL)

**UI/UX**:
```
┌─────────────────────────────────────┐
│  [Poster]    Title (Year)           │
│              ─────────────          │
│              Added by @user         │
│              Status: To Watch       │
│                                     │
│  ┌─────────────────────────────┐    │
│  │                             │    │
│  │    [TikTok/Reel playing]    │    │
│  │                             │    │
│  └─────────────────────────────┘    │
│                                     │
│  [Mark Watched]  [Remove]  [Close]  │
└─────────────────────────────────────┘
```

---

### Phase 3: Social Features - Following
**Goal**: Discover what friends are watching

- [ ] User search (by username/email)
- [ ] Follow/unfollow users
- [ ] Profile page showing followers/following counts
- [ ] View other users' public lists (read-only)
- [ ] Activity feed: "Alex added Oppenheimer to Weekend Binges"

**Database Changes**:
```
users/{userId}/following/{targetUserId}
  - followedAt: timestamp

users/{userId}/followers/{followerUserId}
  - followedAt: timestamp

users/{userId}
  - followersCount: number
  - followingCount: number
```

---

### Phase 4: Collaborative Lists
**Goal**: Share lists with up to 3 friends who can all add/remove movies

- [ ] Invite friends to a list (by email or from following)
- [ ] Accept/decline list invitations
- [ ] Max 3 members per collaborative list
- [ ] All members can add/remove movies
- [ ] Show who added each movie
- [ ] List owner can remove members
- [ ] Leave a collaborative list

**Database Changes**:
```
lists/{listId}
  - name: "Movie Club Picks"
  - ownerId: userId
  - members: [userId1, userId2, userId3]
  - createdAt: timestamp

lists/{listId}/movies/{movieId}
  - (same as before, but shared)

listInvites/{inviteId}
  - listId, listName
  - fromUserId, toUserId
  - status: "pending" | "accepted" | "declined"
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- Firebase project with Firestore & Authentication enabled
- TMDB API key

### Environment Variables

Create a `.env.local` file:

```env
# Firebase Client SDK (public)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (server-side, keep secret)
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxx@your_project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# TMDB API
NEXT_PUBLIC_TMDB_ACCESS_TOKEN=your_tmdb_token
```

### Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login/signup pages
│   ├── actions.ts       # Server actions (Firestore writes)
│   ├── layout.tsx
│   └── page.tsx         # Main watchlist page
├── components/
│   ├── ui/              # shadcn components
│   ├── add-movie-form.tsx
│   ├── movie-card.tsx
│   └── movie-list.tsx
├── firebase/
│   ├── index.ts         # Client SDK init & hooks
│   ├── admin.ts         # Admin SDK init
│   └── provider.tsx     # Auth context
└── lib/
    └── types.ts         # TypeScript types
```

---

## Contributing

This is a personal project, but feel free to fork and adapt for your own movie nights!
