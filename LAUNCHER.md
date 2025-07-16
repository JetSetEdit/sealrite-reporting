# SealRite Reporting Tool - Unified Launcher

The unified launcher provides a single interface to manage all aspects of the SealRite Reporting Tool, including the backend API server, React dashboard, and CLI commands.

## Quick Start

```bash
# Start the unified launcher
npm run launch

# Or run directly
node launcher.js
```

## Features

### 🚀 Service Management
- **Start Backend Server**: Launches the Express API server on port 3000
- **Start React Dashboard**: Launches the React dashboard on port 3001
- **Start Both**: Launches both services simultaneously
- **Stop All Services**: Gracefully stops all running services

### 📊 CLI Commands
- **Fetch Data**: Download social media data from Graph API
- **Generate Report**: Create monthly reports in PDF and Excel formats
- **Find Page ID**: Discover available Facebook pages
- **Test Connection**: Verify API connectivity
- **Test KPIs**: Validate KPI calculations
- **Test Instagram**: Check Instagram API integration

### ⚡ Quick Actions
- **Quick Start**: Launch both backend and dashboard with one command
- **Fetch & Generate Report**: Complete workflow from data fetch to report generation
- **Check System Status**: View running services and configuration status
- **View Recent Reports**: List recently generated reports

### 📋 System Information
- **View Available Pages**: List Facebook pages accessible with your token
- **System Status**: Check service status, environment variables, and reports directory

## Menu Navigation

The launcher uses a hierarchical menu system:

```
📋 MAIN MENU
============
1. 🚀 Start Backend Server (API)
2. 🎨 Start React Dashboard
3. 🔄 Start Both (Backend + Dashboard)
4. 📊 CLI Commands
5. 🔍 Quick Actions
6. 📋 View Available Pages
7. 🛑 Stop All Services
8. ❌ Exit
```

## Service Ports

- **Backend API**: http://localhost:3000
- **React Dashboard**: http://localhost:3001

## Environment Setup

Before using the launcher, ensure your `.env` file is configured:

```env
FACEBOOK_ACCESS_TOKEN=your_facebook_access_token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id
```

## Keyboard Shortcuts

- **Ctrl+C**: Gracefully exit the launcher and stop all services
- **Enter**: Confirm menu selections

## Troubleshooting

### Services Won't Start
1. Check if ports 3000 and 3001 are available
2. Verify your `.env` file is properly configured
3. Ensure all dependencies are installed (`npm install`)

### Dashboard Issues
1. Make sure the backend is running first
2. Check that the dashboard dependencies are installed (`cd dashboard && npm install`)

### API Connection Issues
1. Verify your Facebook access token is valid
2. Check that your token has the required permissions
3. Use the "Test Connection" option to diagnose issues

## Development

The launcher is built with Node.js and uses:
- `child_process` for spawning services
- `readline` for interactive menus
- `fs` for file system operations
- `axios` for API calls

## File Structure

```
sealrite-reporting/
├── launcher.js          # Main launcher script
├── LAUNCHER.md          # This documentation
├── src/
│   ├── index.js         # Backend API server
│   ├── cli.js           # CLI commands
│   └── ...
└── dashboard/           # React dashboard
    ├── package.json
    └── ...
```

## Contributing

To extend the launcher:
1. Add new menu options in the appropriate menu method
2. Implement the corresponding action method
3. Update this documentation
4. Test thoroughly before committing

## Support

For issues with the launcher:
1. Check the system status using option 5 → 3
2. Review the console output for error messages
3. Verify your environment configuration
4. Check the main project README for additional troubleshooting steps 