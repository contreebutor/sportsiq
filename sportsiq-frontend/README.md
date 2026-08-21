# SportsIQ Frontend

A React + TypeScript frontend application for SportsIQ, featuring real-time sports dashboards, contest management, and user predictions.

## Tech Stack

- **React 19** with TypeScript
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Supabase** - Backend services (authentication, database)
- **React Router** - Client-side routing
- **Zustand** - State management

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- Supabase account and project
- Backend API server (for contest operations)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/LumenIQ25/sportsiq-frontend
cd sportsiq-frontend
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_BACKEND_URL=your_backend_api_url
```

**Example:**

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_BACKEND_URL=http://localhost:3000
```

> **Note:** The `.env` file is gitignored. Make sure to set up your environment variables before running the application.

### 4. Run the Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:5173` (or the port shown in the terminal).

## Available Scripts

- `npm run dev` - Start the development server with hot reload
- `npm run build` - Build the application for production
- `npm run preview` - Preview the production build locally
- `npm run lint` - Run ESLint to check code quality

## Application Routes

### Public Routes

- **`/signin`** - User authentication page

  - Sign in with email and password
  - Sign up for new accounts

- **`/dashboard/:id`** - Main dashboard view

  - Displays NBA and NFL dashboards
  - Rotates between views automatically
  - Requires a valid profile ID
  - Default redirect: `/dashboard/35d34afb-3138-4e86-8b13-a67279b2aa7f`

- **`/submit-predictions/:id`** - Contest submission page

  - Mobile-optimized view
  - Allows users to submit predictions for contests
  - Flow: Predictions → Join Game → Verify OTP → Confirmation

- **`/contest-winner/:id`** - Contest winner redemption page
  - Mobile-optimized view
  - Displays winner information and allows redemption

### Protected Routes

- **`/manage`** - Admin/Management Panel
  - Requires authentication (redirects to `/signin` if not logged in)
  - Two main sections:
    - **User Management**: Manage user profiles, roles, and view settings
    - **Contest Management**: Create and manage contests, games, and quarters

## Mock Data

The application includes mock data for development and testing purposes:

**Location:** `src/data/mockData.ts`

- `MOCK_GAMES` - Sample NBA game data with live scores, odds, and statistics
- `MOCK_CONTEST_GAME_TODAY` - Sample contest game data
- `MOCK_CONTESTS_WITH_PREDICTIONS` - Sample contest data with predictions

To use mock data in development, you can import and use these constants in your components.

## Admin Dashboard

### Accessing the Admin Dashboard

1. **Sign In**: Navigate to `/signin` and sign in with an admin account
2. **Access Management Panel**: Go to `/manage` (protected route)
3. **Navigate Tabs**: Use the sidebar to switch between:
   - **Manage Users** - User management interface
   - **Manage Contests** - Contest management interface

### Admin Features

#### User Management

- View all user profiles
- Update user roles (admin/user)
- Manage view settings (view count, rotation interval, rotation enable/disable)
- Update user notes and usernames

#### Contest Management

- Create and manage contests
- Set up game cards
- Configure quarters
- Manage contest calendar

### User Panel (Non-Admin)

Non-admin users can access `/manage` to:

- View and update their own view management settings
- Configure rotation intervals and view counts

## Contests

### Viewing Contests

Contests are displayed on the dashboard (`/dashboard/:id`) and can be filtered by:

- Game status (Scheduled, InProgress, Final)
- Sport (NBA, NFL)
- Date

### Submitting Predictions

1. Navigate to `/submit-predictions/:id` where `:id` is the contest game ID
2. Enter predictions for each quarter (1, 2, 3, 4) and full game
3. Provide nickname and phone number
4. Verify phone number with OTP
5. Submit predictions

### Contest Winner Redemption

1. Navigate to `/contest-winner/:id` where `:id` is the contest winner ID
2. View winner information
3. Redeem the prize

## Project Structure

```
src/
├── components/          # Reusable React components
│   ├── Dashboard/      # Dashboard-related components
│   ├── DashboardV2/    # Updated dashboard components
│   ├── Contest/        # Contest-related components
│   └── ...
├── pages/              # Page components
│   ├── Dashboard.tsx
│   ├── SignIn.tsx
│   ├── ManagePanel/    # Admin panel pages
│   └── Contest/        # Contest pages
├── hooks/              # Custom React hooks
│   ├── useAuth.tsx     # Authentication hook
│   └── useContest.tsx  # Contest data hook
├── services/           # API service functions
│   ├── contestService.ts
│   └── ...
├── store/              # Zustand state management
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
│   ├── supabase.ts    # Supabase client
│   └── utils.ts        # Helper functions
└── data/               # Mock data
    └── mockData.ts
```

## Authentication

The application uses Supabase for authentication:

- **Sign Up**: Creates user in Supabase Auth and creates profile in database
- **Sign In**: Authenticates with Supabase
- **Protected Routes**: Uses `ProtectedRoute` component to guard admin routes
- **Session Management**: Automatically handles session persistence and updates

## Database (Supabase)

The application expects the following Supabase tables:

- `profiles` - User profile information

## Backend API Integration

The frontend communicates with a backend API for:

- User signup: `POST /v1/auth/signup`
- OTP creation: `POST /v1/contest/create-otp`
- OTP verification: `POST /v1/contest/verify-otp`
- Contest redemption: `POST /v1/contest/update-contest-redeemed`

Set the `VITE_BACKEND_URL` environment variable to point to your backend API.

## Development Tips

1. **Hot Reload**: The Vite dev server supports hot module replacement (HMR) for instant updates
2. **TypeScript**: All components are typed - check the console for type errors
3. **Linting**: Run `npm run lint` before committing to catch code quality issues
4. **Mock Data**: Use mock data from `src/data/mockData.ts` for testing without backend
5. **Viewport Scaling**: The app uses custom viewport scaling for different screen sizes (1920x1080 for desktop, full viewport for mobile)

## Building for Production

```bash
npm run build
```

The production build will be output to the `dist/` directory. You can preview it locally with:

```bash
npm run preview
```

## Deployment

The application is configured for Vercel deployment (see `vercel.json`). The build output in `dist/` can be deployed to any static hosting service.

## Troubleshooting

### Environment Variables Not Loading

- Ensure your `.env` file is in the root directory
- Restart the dev server after adding/changing environment variables
- Check that variable names start with `VITE_`

### Supabase Connection Issues

- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` are correct
- Check Supabase project settings
- Ensure Row Level Security (RLS) policies allow necessary operations

### Backend API Errors

- Verify `VITE_BACKEND_URL` is set correctly
- Check that the backend server is running
- Review browser console and network tab for API errors

## License

[Add your license information here]
