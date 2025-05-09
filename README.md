# Leach Hockey Scoreboard

A Next.js application for tracking scores and managing hockey games at the Leach Ice Arena. This interactive scoreboard is designed for 4-way hockey games with a rotating team system.

![Leach Hockey Scoreboard](public/leach-icon-lg.png)

## Features

- **Interactive Timer**: Configurable game clock with play/pause functionality and buzzer
- **Team Management**: Track multiple teams with customizable names and logos
- **Score Tracking**: Automatically update scores based on game results
- **Team Rotation**: Manage which teams are on the ice and their roles (defending, challenging, waiting)
- **Match History**: Undo functionality for correcting scoring mistakes
- **Mobile Responsive**: Works on all device sizes
- **PWA Support**: Can be installed as a Progressive Web App for offline use
- **Local Storage**: Game state persists between sessions
- **Background Timer**: Timer continues to run correctly even when the app is in the background
- **Screen Wake Lock**: Prevents the screen from turning off while the timer is running (Chrome/Edge only)

## Getting Started

### Prerequisites

- Node.js 18.0 or later
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/score-the-leach-app.git
   cd score-the-leach-app
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Run the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
src/
├── app/                  # Next.js app directory
│   ├── page.tsx          # Main page component
│   ├── layout.tsx        # Root layout
│   ├── globals.css       # Global styles
│   └── fonts.ts          # Font configuration
├── components/           # React components
│   ├── HockeyScoreboard.tsx  # Main container component
│   ├── TimerSection.tsx      # Timer display and controls
│   ├── TeamsSection.tsx      # Teams display
│   ├── ControlsSection.tsx   # Game controls
│   └── TeamSetupModal.tsx    # Team setup modal
├── types/                # TypeScript type definitions
│   └── index.ts          # Shared types
└── utils/                # Utility functions
    ├── storage.ts        # LocalStorage utilities
    ├── timerSync.ts      # Timer synchronization for background operation
    └── wakeLock.ts       # Screen wake lock functionality
```

## Component Architecture

The application is structured with the following components:

- **HockeyScoreboard**: Main container component that manages state and coordinates other components
- **TimerSection**: Handles the game clock display and controls
- **TeamsSection**: Displays team information, logos, and scores
- **ControlsSection**: Contains game control buttons and match counter
- **TeamSetupModal**: Modal for configuring teams at the start of a game

## State Management

The application uses React's built-in state management with the following key state elements:

- **teams**: Array of team objects with scores and status
- **period**: Current match number
- **time/minutes/seconds**: Timer state
- **scoreHistory**: History of previous states for undo functionality
- **editMode**: Whether direct editing of scores is enabled

All state is persisted to localStorage for session continuity.

## Contributing

Here's how you can contribute to the project:

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Make your changes
4. Run tests: `npm test`
5. Commit your changes: `git commit -m 'Add some feature'`
6. Push to the branch: `git push origin feature/your-feature-name`
7. Submit a pull request

### Coding Standards

- Use TypeScript for all new files
- Follow the existing component structure
- Use functional components with hooks
- Add appropriate comments for complex logic
- Ensure mobile responsiveness

### Testing

- Test your changes on multiple browsers
- Verify mobile responsiveness
- Check that localStorage persistence works correctly

## Deployment

The application can be deployed to any static hosting service:

1. Build the production version:
   ```bash
   npm run build
   # or
   yarn build
   ```

2. The output in the `.next` directory can be deployed to services like Vercel, Netlify, or any static hosting.
