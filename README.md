# Smart Rounder

Smart Rounder is an all-in-one productivity app built with Expo for Android and Windows platforms. It integrates task management, note-taking, calendar, alarms, YouTube viewing, web search, and weather forecasting in a single application.

![Smart Rounder App](./assets/icon.png)

## Features

### Task Management
- Create, edit, and delete tasks
- Set priorities and due dates
- Organize tasks into categories
- Filter and sort tasks
- Get notifications for upcoming deadlines

### Notes
- Create and edit rich text notes
- Organize notes into folders
- Pin important notes
- Archive older notes
- Search functionality

### Calendar
- View events in month, week, or day view
- Create and manage events
- Set reminders
- Sync with device calendar
- Multiple calendar support

### Alarms
- Set one-time or recurring alarms
- Customize alarm sounds
- Snooze functionality
- Smart alarms

### Additional Features
- **YouTube**: Watch YouTube videos directly within the app
- **Web Search**: Search the web without leaving the app
- **Weather Forecast**: Check current weather and forecasts

### User Interface
- Dark mode support
- Customizable theme colors
- Intuitive navigation
- Responsive design for different screen sizes

### Data Management
- User account system
- Data synchronization across devices
- Backup and restore functionality

## Installation

### Prerequisites
- Node.js 20.0.0 or later
- Yarn or npm
- Expo CLI

### Setup
1. Clone the repository:
   ```bash
   git clone https://github.com/ZundamonnoVRChatkaisetu/smart-rounder.git
   cd smart-rounder
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

4. Run on Android:
   ```bash
   npm run android
   # or
   yarn android
   ```

5. Run on web (for Windows):
   ```bash
   npm run web
   # or
   yarn web
   ```

## Building for Production

### Android
```bash
eas build -p android
```

### Windows (Progressive Web App)
```bash
expo build:web
```

## Project Structure

```
smart-rounder/
├── assets/                 # Images and other static assets
├── src/
│   ├── app/                # Main app components
│   ├── components/         # Reusable UI components
│   ├── contexts/           # React contexts for state management
│   ├── models/             # TypeScript interfaces and types
│   ├── navigation/         # Navigation configuration
│   ├── screens/            # Screen components for each feature
│   ├── stores/             # Zustand stores for state management
│   ├── types/              # TypeScript type definitions
│   └── utils/              # Utility functions
├── App.tsx                 # Entry point
├── app.json                # Expo configuration
├── package.json            # Dependencies and scripts
└── tsconfig.json           # TypeScript configuration
```

## Core Technologies

- **Framework**: Expo & React Native
- **Language**: TypeScript
- **UI Components**: React Native Paper
- **Navigation**: React Navigation
- **State Management**: Zustand & React Context
- **Storage**: SQLite & AsyncStorage
- **API Integration**: WebView for external services

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [Expo](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Navigation](https://reactnavigation.org/)
- [Zustand](https://github.com/pmndrs/zustand)
- [SQLite](https://www.sqlite.org/)
