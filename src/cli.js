#!/usr/bin/env node

const GraphAPI = require('./graphApi');
const ReportGenerator = require('./reportGenerator');
const moment = require('moment');
require('dotenv').config();

class CLI {
  constructor() {
    this.graphApi = new GraphAPI();
    this.reportGenerator = new ReportGenerator();
  }

  async run() {
    const args = process.argv.slice(2);
    const command = args[0];

    switch (command) {
      case 'fetch':
        await this.fetchData(args);
        break;
      case 'report':
        await this.generateReport(args);
        break;
      case 'help':
        this.showHelp();
        break;
      default:
        console.log('❌ Unknown command. Use "help" to see available commands.');
        process.exit(1);
    }
  }

  async fetchData(args) {
    const pageId = args[1];
    const outputFile = args[2] || `data_${moment().format('YYYY-MM-DD_HH-mm-ss')}.json`;

    if (!pageId) {
      console.log('❌ Page ID is required. Usage: npm run fetch <pageId> [outputFile]');
      process.exit(1);
    }

    try {
      console.log(`📊 Fetching data for page: ${pageId}`);
      const data = await this.graphApi.getMonthlyData(pageId);
      
      // Save to file
      const fs = require('fs').promises;
      await fs.writeFile(outputFile, JSON.stringify(data, null, 2));
      
      console.log(`✅ Data saved to: ${outputFile}`);
      console.log(`📈 Facebook insights: ${data.facebook?.insights?.data?.length || 0} metrics`);
      console.log(`📸 Instagram insights: ${data.instagram?.insights?.data?.length || 0} metrics`);
      console.log(`📝 Facebook posts: ${data.facebook?.posts?.data?.length || 0} posts`);
      console.log(`📷 Instagram posts: ${data.instagram?.posts?.data?.length || 0} posts`);
    } catch (error) {
      console.error('❌ Error fetching data:', error.message);
      process.exit(1);
    }
  }

  async generateReport(args) {
    const pageId = args[1];
    const pageName = args[2];
    const month = args[3] || moment().format('YYYY-MM');
    const dataFile = args[4];

    if (!pageId || !pageName) {
      console.log('❌ Page ID and Page Name are required. Usage: npm run report <pageId> <pageName> [month] [dataFile]');
      process.exit(1);
    }

    try {
      let data;
      
      if (dataFile) {
        console.log(`📂 Loading data from file: ${dataFile}`);
        const fs = require('fs').promises;
        const fileContent = await fs.readFile(dataFile, 'utf8');
        data = JSON.parse(fileContent);
      } else {
        console.log(`📊 Fetching fresh data for page: ${pageId}`);
        data = await this.graphApi.getMonthlyData(pageId);
      }

      console.log(`📋 Generating report for ${pageName} - ${month}`);
      const reportFiles = await this.reportGenerator.generateComprehensiveReport(
        data,
        pageName,
        month
      );

      console.log('✅ Report generated successfully!');
      console.log(`📊 Excel report: ${reportFiles.excel}`);
      console.log(`📄 PDF report: ${reportFiles.pdf}`);
    } catch (error) {
      console.error('❌ Error generating report:', error.message);
      process.exit(1);
    }
  }

  showHelp() {
    console.log(`
🚀 SealRite Reporting Tool - CLI Commands

USAGE:
  npm run <command> [options]

COMMANDS:
  fetch <pageId> [outputFile]     Fetch data from Graph API
  report <pageId> <pageName> [month] [dataFile]  Generate monthly report
  help                           Show this help message

EXAMPLES:
  npm run fetch 123456789012345
  npm run fetch 123456789012345 my_data.json
  npm run report 123456789012345 "My Business" 2024-01
  npm run report 123456789012345 "My Business" 2024-01 my_data.json

ENVIRONMENT VARIABLES:
  Make sure to set up your .env file with:
  - FACEBOOK_ACCESS_TOKEN
  - INSTAGRAM_BUSINESS_ACCOUNT_ID (optional)

OUTPUT:
  Reports are saved to the ./reports directory
  Data files are saved as JSON in the current directory
    `);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  const cli = new CLI();
  cli.run().catch(error => {
    console.error('❌ CLI Error:', error);
    process.exit(1);
  });
}

module.exports = CLI; 