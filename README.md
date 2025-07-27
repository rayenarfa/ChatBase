# ChatBase - Real-time Chat Application

A modern real-time chat application built with React, TypeScript, Tailwind CSS, and Supabase. Features include Google authentication, friend management, private messaging, and real-time updates.

## Features

- 🔐 **Google Authentication** - Secure sign-in with Supabase Auth
- 👥 **Friend Management** - Add friends by user ID or email
- 📨 **Friend Requests** - Send, accept, and reject friend requests
- 💬 **Real-time Messaging** - Instant message delivery with Supabase Realtime
- 🗑️ **Message Deletion** - Delete messages (removes for both users)
- 🚫 **User Blocking** - Block users to prevent communication
- 🎨 **Modern UI** - Beautiful interface with Tailwind CSS and Framer Motion
- 📱 **Responsive Design** - Works on desktop and mobile devices

## Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS + Framer Motion
- **UI Components**: Chakra UI (modals, toasts, buttons)
- **Backend**: Supabase (Auth, Database, Realtime)
- **Icons**: Lucide React + React Icons

## Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Google OAuth credentials

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd ChatBase
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings > API to get your project URL and anon key
3. Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Database Schema

Run the following SQL in your Supabase SQL editor:

```sql
-- USERS TABLE (linked to Supabase Auth)
create table users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text,
  email text,
  avatar_url text,
  created_at timestamp default now()
);

-- FRIEND REQUESTS
create table friend_requests (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid references users(id) on delete cascade,
  receiver_id uuid references users(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'rejected', 'blocked')) default 'pending',
  created_at timestamp default now()
);

-- CHATS TABLE
create table chats (
  id uuid primary key default gen_random_uuid(),
  is_group boolean default false,
  created_at timestamp default now()
);

-- CHAT MEMBERS (2 users per chat for private messages)
create table chat_members (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  user_id uuid references users(id) on delete cascade
);

-- MESSAGES TABLE
create table messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references chats(id) on delete cascade,
  sender_id uuid references users(id) on delete cascade,
  content text,
  sent_at timestamp default now()
);

-- BLOCKED USERS
create table blocked_users (
  id uuid primary key default gen_random_uuid(),
  blocker_id uuid references users(id) on delete cascade,
  blocked_id uuid references users(id) on delete cascade,
  created_at timestamp default now()
);
```

### 4. Google OAuth Setup

1. Go to Supabase Dashboard > Authentication > Providers
2. Enable Google provider
3. Add your Google OAuth credentials (Client ID and Secret)
4. Set the redirect URL to: `https://your-project.supabase.co/auth/v1/callback`

### 5. Enable Realtime

1. Go to Supabase Dashboard > Database > Replication
2. Enable realtime for the `messages` table

### 6. Run the Application

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

## Usage

### Authentication

- Click "Continue with Google" to sign in
- Your profile will be automatically created on first login

### Adding Friends

1. Click "Add Friend" button in the Friends tab
2. Search by user ID or email
3. Send a friend request
4. Wait for the other user to accept

### Messaging

1. Accept a friend request from another user
2. A chat will be automatically created
3. Start sending messages in real-time
4. Delete your own messages (removes for both users)

### Managing Friends

- View pending friend requests in the Requests tab
- Accept or reject incoming requests
- Remove friends (deletes chat and messages)
- Block users (prevents communication)

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Sidebar.tsx     # Navigation sidebar
│   ├── ChatWindow.tsx  # Chat interface
│   └── AddFriendModal.tsx # Add friend modal
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom hooks
│   ├── useFriends.ts   # Friend management
│   └── useChats.ts     # Chat and messaging
├── lib/                # Utilities and config
│   └── supabase.ts     # Supabase client and types
├── pages/              # Page components
│   ├── LoginPage.tsx   # Login screen
│   └── ChatPage.tsx    # Main chat interface
└── App.tsx             # Main app component
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Key Features Implementation

- **Real-time Updates**: Uses Supabase Realtime subscriptions
- **Friend System**: Complete friend request workflow
- **Message Management**: Send, receive, and delete messages
- **User Blocking**: Prevent communication between blocked users
- **Responsive Design**: Mobile-first approach with Tailwind CSS

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details
