# Cosmos Odyssey

A React-based space travel booking application that allows users to search and book interplanetary flights.

## Features

- Search for routes between different planets
- View and compare different flight providers
- Filter routes by fastest or cheapest options
- Book multi-leg journeys with different providers
- View and manage reservations
- Real-time price list expiration tracking
- Responsive design for (most?) devices

## Technologies Used

- ReactJS (NodeJS)
- Material-UI (MUI) (for the design part)

## Getting Started

### Prerequisites

- Node.js
- npm 

### Installation

1. Clone the repository
```bash
git clone 
```

2. Install dependencies
```bash
cd cosmos-odyssey
npm install
```

3. Start the development server
```bash
npm run dev
```

The application will start running at `http://localhost:5173` 
(or whatever port is available)

## Project Structure

```
cosmos-odyssey/
├── src/
│   ├── assets/          # Static assets (images, icons)
│   ├── components/      # Reusable React components
│   │   ├── Header.jsx   # Application header
│   │   ├── Results.jsx  # Search results display
│   │   ├── SearchBar.jsx# Search interface
│   │   └── Timer.jsx    # Countdown timer component
│   ├── pages/           # Page components
│   │   └── Reservations.jsx
│   ├── utils/          # Utility functions
│   │   ├── db.js       # Local storage operations
│   │   └── routeUtils.js# Route calculation utilities
│   ├── Colors.css      # Global color variables
│   ├── App.jsx         # Main application component
│   └── main.jsx        # Application entry point
├── public/             # Public assets
├── tests/              # Test files
├── .gitignore         # Git ignore rules
├── package.json       # Project dependencies and scripts
├── vite.config.js     # Vite configuration
└── README.md          # Project documentation
```

## API Integration

The application integrates with the Cosmos Odyssey API:
- Base URL: https://cosmosodyssey.azurewebsites.net/api/v1.0/TravelPrices
- Proxy configuration is handled in vite.config.js 

## Features in Detail

### Search
- Select origin and destination planets
- View available routes and providers
- Compare prices and travel times
- Filter by fastest or cheapest routes
- Filter by specific companies

### Booking
- Select preferred providers for each route segment
- Enter passenger information
- Automatic validation of connecting flights
- Minimum 1-hour and maximum 48-hour layover enforcement (can be changed!)

### Reservations
- View all booked reservations
- Track price list expiration
- Export reservation data (as JSON)
- Delete individual or all reservations

## Possible improvements

- SQL integration, so that the data is not stored locally
- Possible Google API integration (to get the user data)
- Testing, testing, testing! It is still prone to errors.

## Thanks to:

- ReactJS Timer: https://dev.to/yuridevat/how-to-create-a-timer-with-react-7b9
- BroCode: https://www.youtube.com/@BroCodez
- Claude AI (for fixing all of the annoying stuff and helping me understand concepts)


