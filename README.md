# SealRite Social Media Reporting Tool

A comprehensive tool for generating monthly social media reports using the Facebook Graph API. This tool fetches data from Facebook Pages and Instagram Business Accounts, then generates professional reports in both Excel and PDF formats.

## 🚀 Features

- **Graph API Integration**: Fetch data from Facebook Pages and Instagram Business Accounts
- **Multiple Report Formats**: Generate reports in Excel (.xlsx) and PDF formats
- **Comprehensive Metrics**: Page impressions, engagement, followers, demographics, and more
- **Post Performance Analysis**: Individual post insights and performance metrics
- **REST API**: Full API for integration with other systems
- **CLI Tool**: Command-line interface for easy data fetching and report generation
- **Professional Reports**: Clean, branded reports suitable for client delivery

## 📋 Prerequisites

Before using this tool, you'll need:

1. **Facebook Developer Account**: Create an app at [Facebook Developers](https://developers.facebook.com/)
2. **Facebook Page**: The page you want to analyze
3. **Instagram Business Account** (optional): Connected to your Facebook Page
4. **Access Token**: With appropriate permissions for your page

### Required Permissions

Your Facebook App needs these permissions:
- `pages_read_engagement`
- `pages_show_list`
- `pages_manage_metadata`
- `instagram_basic`
- `instagram_manage_insights` (for Instagram insights)

## 🛠️ Installation

1. **Clone the repository**:
   ```bash
   git clone <your-repo-url>
   cd sealrite-reporting
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   cp env.example .env
   ```

4. **Configure your `.env` file**:
   ```env
   FACEBOOK_ACCESS_TOKEN=your_facebook_access_token_here
   FACEBOOK_APP_ID=your_facebook_app_id
   FACEBOOK_APP_SECRET=your_facebook_app_secret
   INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_account_id
   REPORT_OUTPUT_DIR=./reports
   PORT=3000
   ```

## 🔧 Getting Your Access Token

### Method 1: Graph API Explorer
1. Go to [Graph API Explorer](https://developers.facebook.com/tools/explorer/)
2. Select your app from the dropdown
3. Add the required permissions
4. Click "Generate Access Token"
5. Copy the token to your `.env` file

### Method 2: Long-lived Token
For production use, you'll want a long-lived token:
```bash
curl -X GET "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=YOUR_APP_ID&client_secret=YOUR_APP_SECRET&fb_exchange_token=YOUR_SHORT_LIVED_TOKEN"
```

## 📊 Usage

### 🚀 Unified Launcher (Recommended)

The easiest way to use the tool is through the unified launcher:

```bash
# Start the unified launcher
npm run launch

# Or run directly
node launcher.js
```

The launcher provides an interactive menu to:
- Start the backend API server
- Start the React dashboard
- Run CLI commands
- Generate reports
- Check system status
- View available pages

For detailed launcher documentation, see [LAUNCHER.md](./LAUNCHER.md).

### Command Line Interface (CLI)

#### Fetch Data
```bash
# Fetch data for a Facebook page
npm run fetch 123456789012345

# Save to specific file
npm run fetch 123456789012345 my_data.json
```

#### Generate Report
```bash
# Generate report for current month
npm run report 123456789012345 "My Business"

# Generate report for specific month
npm run report 123456789012345 "My Business" 2024-01

# Use existing data file
npm run report 123456789012345 "My Business" 2024-01 my_data.json
```

#### Get Help
```bash
npm run help
```

### REST API

Start the server:
```bash
npm start
```

#### Available Endpoints

**Health Check**
```bash
GET /health
```

**Get Available Metrics**
```bash
GET /api/metrics
```

**Fetch Data**
```bash
POST /api/fetch-data
Content-Type: application/json

{
  "pageId": "123456789012345",
  "includeInstagram": true
}
```

**Generate Report**
```bash
POST /api/generate-report
Content-Type: application/json

{
  "pageId": "123456789012345",
  "pageName": "My Business",
  "month": "2024-01"
}
```

**Get Facebook Insights**
```bash
GET /api/facebook/123456789012345/insights?metrics=page_impressions,page_engaged_users&period=month
```

**Get Instagram Insights**
```bash
GET /api/instagram/insights?metrics=impressions,reach&period=month
```

**Get Facebook Posts**
```bash
GET /api/facebook/123456789012345/posts?limit=25
```

**Get Instagram Posts**
```bash
GET /api/instagram/posts?limit=25
```

## 📈 Available Metrics

### Facebook Metrics
- `page_impressions` - Total page impressions
- `page_engaged_users` - Users who engaged with your page
- `page_post_engagements` - Total post engagements
- `page_followers` - Number of page followers
- `page_views_total` - Total page views
- `page_fans_city` - Fans by city
- `page_fans_country` - Fans by country
- `page_fans_gender_age` - Fans by gender and age

### Instagram Metrics
- `impressions` - Total impressions
- `reach` - Total reach
- `profile_views` - Profile views
- `follower_count` - Number of followers
- `email_contacts` - Email contact clicks
- `get_directions_clicks` - Direction clicks
- `phone_call_clicks` - Phone call clicks
- `text_message_clicks` - Text message clicks
- `website_clicks` - Website clicks

## 📄 Report Output

Reports are generated in the `./reports` directory with the following structure:

### Excel Report (.xlsx)
- **Overview Sheet**: Key metrics summary
- **Facebook Insights**: Detailed Facebook metrics
- **Instagram Insights**: Detailed Instagram metrics
- **Posts Performance**: Individual post analysis
- **Audience Demographics**: Audience breakdown

### PDF Report (.pdf)
- Executive summary with key metrics
- Clean, professional formatting
- Suitable for client delivery

## 🔍 Finding Your Page ID

1. Go to your Facebook Page
2. Click "About" in the left sidebar
3. Scroll down to find your Page ID
4. Or use the Graph API Explorer to search for your page name

## 🐛 Troubleshooting

### Common Issues

**"Invalid access token"**
- Check that your access token is valid and not expired
- Ensure you have the correct permissions

**"Page not found"**
- Verify your Page ID is correct
- Ensure your access token has access to the page

**"Instagram insights not available"**
- Make sure your Instagram account is a Business Account
- Verify it's connected to your Facebook Page
- Check that you have the `instagram_manage_insights` permission

**"Rate limit exceeded"**
- The Graph API has rate limits
- Wait a few minutes and try again
- Consider implementing rate limiting in your requests

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
```

## 🔒 Security

- Never commit your `.env` file to version control
- Use long-lived tokens for production
- Implement proper token refresh mechanisms
- Consider using Facebook's App Review process for production apps

## 📝 License

MIT License - see LICENSE file for details

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support or questions:
- Check the troubleshooting section
- Review Facebook's Graph API documentation
- Open an issue in this repository

## 🔄 Updates

Stay updated with the latest Graph API changes by:
- Following Facebook's developer blog
- Checking the Graph API changelog
- Updating your access tokens regularly 