# SealRite Dashboard

A modern React-based dashboard for visualizing monthly social media analytics and generating comprehensive reports.

## Features

- 📊 **Real-time Analytics**: View Facebook and Instagram metrics in real-time
- 📈 **Interactive Charts**: Beautiful charts powered by Recharts
- 📱 **Responsive Design**: Works perfectly on desktop, tablet, and mobile
- 🔄 **Auto-refresh**: Keep data up-to-date with manual refresh
- 📄 **Report Generation**: Generate comprehensive PDF and Excel reports
- 🎨 **Modern UI**: Clean, professional interface with Tailwind CSS

## Quick Start

### Prerequisites

- Node.js 16+ 
- npm or yarn
- Backend server running (see main README)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3001](http://localhost:3001) in your browser

### Building for Production

```bash
npm run build
```

The built files will be in the `build/` directory and will be served by the main Express server.

## Usage

1. **Select a Page**: Use the page selector dropdown to choose which Facebook page to analyze
2. **View Metrics**: See key metrics displayed in beautiful cards with icons
3. **Explore Charts**: Interactive charts show engagement, reach, and follower trends
4. **Browse Posts**: View recent posts with their performance metrics
5. **Generate Reports**: Click "Generate Report" to create comprehensive monthly reports

## Components

- **MetricCard**: Displays individual metrics with icons and formatting
- **ChartComponent**: Interactive charts using Recharts library
- **DataTable**: Tabular view of recent posts with filtering
- **PageSelector**: Dropdown to select Facebook pages

## Styling

The dashboard uses Tailwind CSS for styling with custom components defined in `src/index.css`. The design follows modern UI/UX principles with:

- Clean, minimalist design
- Consistent spacing and typography
- Responsive grid layouts
- Hover effects and transitions
- Platform-specific colors (Facebook blue, Instagram pink)

## API Integration

The dashboard communicates with the backend API endpoints:

- `GET /api/pages` - Fetch available Facebook pages
- `POST /api/fetch-data` - Get analytics data for a page
- `POST /api/generate-report` - Generate monthly reports

## Development

### Project Structure

```
dashboard/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── MetricCard.js
│   │   ├── ChartComponent.js
│   │   ├── DataTable.js
│   │   └── PageSelector.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── package.json
├── tailwind.config.js
└── postcss.config.js
```

### Adding New Features

1. Create new components in `src/components/`
2. Add new API endpoints in the backend
3. Update the main App.js to include new features
4. Style with Tailwind CSS classes

## Troubleshooting

- **Dashboard not loading**: Ensure the backend server is running on port 3000
- **No data showing**: Check that your Facebook access token is valid
- **Charts not rendering**: Verify that Recharts is properly installed
- **Styling issues**: Make sure Tailwind CSS is properly configured

## Contributing

1. Follow the existing code style and patterns
2. Add proper error handling for new features
3. Test on different screen sizes for responsiveness
4. Update documentation for new features 