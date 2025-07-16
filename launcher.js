#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const readline = require('readline');
const CLI = require('./src/cli');

class UnifiedLauncher {
  constructor() {
    this.backendProcess = null;
    this.dashboardProcess = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log(`
🚀 SealRite Reporting Tool - Unified Launcher
==============================================

Welcome to the SealRite Reporting Tool! This launcher can help you:

1. Start the backend API server
2. Start the React dashboard
3. Run CLI commands
4. Generate reports
5. Fetch data from social media APIs

What would you like to do?
    `);

    await this.showMainMenu();
  }

  async showMainMenu() {
    console.log(`
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

Enter your choice (1-8): `);

    const choice = await this.getUserInput();

    switch (choice) {
      case '1':
        await this.startBackend();
        break;
      case '2':
        await this.startDashboard();
        break;
      case '3':
        await this.startBoth();
        break;
      case '4':
        await this.showCLIMenu();
        break;
      case '5':
        await this.showQuickActions();
        break;
      case '6':
        await this.viewAvailablePages();
        break;
      case '7':
        await this.stopAllServices();
        break;
      case '8':
        await this.exit();
        break;
      default:
        console.log('❌ Invalid choice. Please try again.\n');
        await this.showMainMenu();
    }
  }

  async showCLIMenu() {
    console.log(`
📊 CLI COMMANDS
===============
1. 📥 Fetch Data from Graph API
2. 📋 Generate Monthly Report
3. 🔍 Find Page ID
4. 🧪 Test Connection
5. 📊 Test KPIs
6. 📸 Test Instagram
7. ↩️  Back to Main Menu

Enter your choice (1-7): `);

    const choice = await this.getUserInput();

    switch (choice) {
      case '1':
        await this.fetchData();
        break;
      case '2':
        await this.generateReport();
        break;
      case '3':
        await this.findPageId();
        break;
      case '4':
        await this.testConnection();
        break;
      case '5':
        await this.testKPIs();
        break;
      case '6':
        await this.testInstagram();
        break;
      case '7':
        await this.showMainMenu();
        break;
      default:
        console.log('❌ Invalid choice. Please try again.\n');
        await this.showCLIMenu();
    }
  }

  async showQuickActions() {
    console.log(`
⚡ QUICK ACTIONS
================
1. 🚀 Quick Start (Backend + Dashboard)
2. 📊 Fetch & Generate Report
3. 🔍 Check System Status
4. 📋 View Recent Reports
5. ↩️  Back to Main Menu

Enter your choice (1-5): `);

    const choice = await this.getUserInput();

    switch (choice) {
      case '1':
        await this.quickStart();
        break;
      case '2':
        await this.quickFetchAndReport();
        break;
      case '3':
        await this.checkSystemStatus();
        break;
      case '4':
        await this.viewRecentReports();
        break;
      case '5':
        await this.showMainMenu();
        break;
      default:
        console.log('❌ Invalid choice. Please try again.\n');
        await this.showQuickActions();
    }
  }

  async startBackend() {
    if (this.backendProcess) {
      console.log('⚠️  Backend server is already running!\n');
      await this.showMainMenu();
      return;
    }

    console.log('🚀 Starting backend server...');
    
    this.backendProcess = spawn('node', ['src/index.js'], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    this.backendProcess.on('error', (error) => {
      console.error('❌ Failed to start backend server:', error);
    });

    this.backendProcess.on('close', (code) => {
      console.log(`\n🔴 Backend server stopped with code ${code}`);
      this.backendProcess = null;
    });

    // Wait a moment for server to start
    await this.sleep(2000);
    console.log('✅ Backend server started on http://localhost:3000\n');
    await this.showMainMenu();
  }

  async startDashboard() {
    if (this.dashboardProcess) {
      console.log('⚠️  Dashboard is already running!\n');
      await this.showMainMenu();
      return;
    }

    console.log('🎨 Starting React dashboard...');
    
    this.dashboardProcess = spawn('npm', ['start'], {
      stdio: 'inherit',
      cwd: path.join(process.cwd(), 'dashboard')
    });

    this.dashboardProcess.on('error', (error) => {
      console.error('❌ Failed to start dashboard:', error);
    });

    this.dashboardProcess.on('close', (code) => {
      console.log(`\n🔴 Dashboard stopped with code ${code}`);
      this.dashboardProcess = null;
    });

    // Wait a moment for dashboard to start
    await this.sleep(3000);
    console.log('✅ Dashboard started on http://localhost:3001\n');
    await this.showMainMenu();
  }

  async startBoth() {
    console.log('🔄 Starting both backend and dashboard...\n');
    
    await this.startBackend();
    await this.sleep(1000);
    await this.startDashboard();
  }

  async quickStart() {
    console.log('⚡ Quick starting both services...\n');
    await this.startBoth();
  }

  async fetchData() {
    console.log('\n📥 Fetch Data from Graph API');
    console.log('============================');
    
    const pageId = await this.getUserInput('Enter Page ID: ');
    const outputFile = await this.getUserInput('Output file (optional, press Enter for default): ') || `data_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;

    try {
      const cli = new CLI();
      await cli.fetchData(['fetch', pageId, outputFile]);
      console.log('\n✅ Data fetched successfully!\n');
    } catch (error) {
      console.error('❌ Error fetching data:', error.message);
    }

    await this.showCLIMenu();
  }

  async generateReport() {
    console.log('\n📋 Generate Monthly Report');
    console.log('==========================');
    
    const pageId = await this.getUserInput('Enter Page ID: ');
    const pageName = await this.getUserInput('Enter Page Name: ');
    const month = await this.getUserInput('Month (YYYY-MM, press Enter for current): ') || new Date().toISOString().slice(0, 7);
    const dataFile = await this.getUserInput('Data file (optional, press Enter to fetch fresh data): ');

    try {
      const cli = new CLI();
      const args = ['report', pageId, pageName, month];
      if (dataFile) args.push(dataFile);
      await cli.generateReport(args);
      console.log('\n✅ Report generated successfully!\n');
    } catch (error) {
      console.error('❌ Error generating report:', error.message);
    }

    await this.showCLIMenu();
  }

  async findPageId() {
    console.log('\n🔍 Finding Page ID...');
    try {
      exec('node src/findPageId.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error:', error);
        } else {
          console.log(stdout);
        }
      });
    } catch (error) {
      console.error('❌ Error finding page ID:', error.message);
    }
    await this.showCLIMenu();
  }

  async testConnection() {
    console.log('\n🧪 Testing connection...');
    try {
      exec('node src/test.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error:', error);
        } else {
          console.log(stdout);
        }
      });
    } catch (error) {
      console.error('❌ Error testing connection:', error.message);
    }
    await this.showCLIMenu();
  }

  async testKPIs() {
    console.log('\n📊 Testing KPIs...');
    try {
      exec('node src/test-kpis.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error:', error);
        } else {
          console.log(stdout);
        }
      });
    } catch (error) {
      console.error('❌ Error testing KPIs:', error.message);
    }
    await this.showCLIMenu();
  }

  async testInstagram() {
    console.log('\n📸 Testing Instagram...');
    try {
      exec('node src/test-instagram.js', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ Error:', error);
        } else {
          console.log(stdout);
        }
      });
    } catch (error) {
      console.error('❌ Error testing Instagram:', error.message);
    }
    await this.showCLIMenu();
  }

  async quickFetchAndReport() {
    console.log('\n⚡ Quick Fetch & Generate Report');
    console.log('================================');
    
    const pageId = await this.getUserInput('Enter Page ID: ');
    const pageName = await this.getUserInput('Enter Page Name: ');

    try {
      const cli = new CLI();
      
      // Fetch data
      console.log('📥 Fetching data...');
      await cli.fetchData(['fetch', pageId]);
      
      // Generate report
      console.log('📋 Generating report...');
      await cli.generateReport(['report', pageId, pageName]);
      
      console.log('\n✅ Quick fetch and report completed!\n');
    } catch (error) {
      console.error('❌ Error in quick action:', error.message);
    }

    await this.showQuickActions();
  }

  async checkSystemStatus() {
    console.log('\n🔍 System Status');
    console.log('================');
    
    // Check if backend is running
    const backendRunning = this.backendProcess && !this.backendProcess.killed;
    console.log(`Backend Server: ${backendRunning ? '🟢 Running' : '🔴 Stopped'}`);
    
    // Check if dashboard is running
    const dashboardRunning = this.dashboardProcess && !this.dashboardProcess.killed;
    console.log(`React Dashboard: ${dashboardRunning ? '🟢 Running' : '🔴 Stopped'}`);
    
    // Check environment variables
    try {
      require('dotenv').config();
      const hasFacebookToken = !!process.env.FACEBOOK_ACCESS_TOKEN;
      const hasInstagramId = !!process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
      
      console.log(`Facebook Token: ${hasFacebookToken ? '🟢 Configured' : '🔴 Missing'}`);
      console.log(`Instagram ID: ${hasInstagramId ? '🟢 Configured' : '🔴 Missing'}`);
    } catch (error) {
      console.log('❌ Error checking environment variables');
    }
    
    // Check reports directory
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      const files = await fs.readdir(reportsDir);
      console.log(`Reports Directory: 🟢 ${files.length} files found`);
    } catch (error) {
      console.log('Reports Directory: 🔴 Not accessible');
    }
    
    console.log('');
    await this.showQuickActions();
  }

  async viewRecentReports() {
    console.log('\n📋 Recent Reports');
    console.log('=================');
    
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      const files = await fs.readdir(reportsDir);
      
      if (files.length === 0) {
        console.log('No reports found.');
      } else {
        const sortedFiles = files
          .filter(file => file.endsWith('.pdf') || file.endsWith('.xlsx'))
          .sort((a, b) => {
            const statsA = fs.statSync(path.join(reportsDir, a));
            const statsB = fs.statSync(path.join(reportsDir, b));
            return statsB.mtime - statsA.mtime;
          })
          .slice(0, 10);
        
        sortedFiles.forEach((file, index) => {
          const stats = fs.statSync(path.join(reportsDir, file));
          console.log(`${index + 1}. ${file} (${stats.mtime.toLocaleDateString()})`);
        });
      }
    } catch (error) {
      console.log('❌ Error reading reports directory');
    }
    
    console.log('');
    await this.showQuickActions();
  }

  async viewAvailablePages() {
    console.log('\n📋 Available Pages');
    console.log('==================');
    
    try {
      // This would require the backend to be running
      if (!this.backendProcess || this.backendProcess.killed) {
        console.log('⚠️  Backend server needs to be running to fetch pages.');
        console.log('Start the backend server first, then try again.\n');
        await this.showMainMenu();
        return;
      }
      
      // Wait a moment for server to be ready
      await this.sleep(1000);
      
      const axios = require('axios');
      const response = await axios.get('http://localhost:3000/api/pages');
      
      if (response.data && response.data.length > 0) {
        response.data.forEach((page, index) => {
          console.log(`${index + 1}. ${page.name} (ID: ${page.id})`);
          console.log(`   Category: ${page.category}`);
          console.log(`   Followers: ${page.followers_count || 'N/A'}`);
          console.log('');
        });
      } else {
        console.log('No pages found.');
      }
    } catch (error) {
      console.log('❌ Error fetching pages:', error.message);
    }
    
    await this.showMainMenu();
  }

  async stopAllServices() {
    console.log('🛑 Stopping all services...');
    
    if (this.backendProcess && !this.backendProcess.killed) {
      this.backendProcess.kill('SIGTERM');
      console.log('✅ Backend server stopped');
    }
    
    if (this.dashboardProcess && !this.dashboardProcess.killed) {
      this.dashboardProcess.kill('SIGTERM');
      console.log('✅ Dashboard stopped');
    }
    
    console.log('✅ All services stopped\n');
    await this.showMainMenu();
  }

  async exit() {
    console.log('\n👋 Goodbye!');
    
    // Stop any running processes
    if (this.backendProcess && !this.backendProcess.killed) {
      this.backendProcess.kill('SIGTERM');
    }
    
    if (this.dashboardProcess && !this.dashboardProcess.killed) {
      this.dashboardProcess.kill('SIGTERM');
    }
    
    this.rl.close();
    process.exit(0);
  }

  async getUserInput(prompt = '') {
    return new Promise((resolve) => {
      this.rl.question(prompt, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Received SIGINT, shutting down gracefully...');
  const launcher = new UnifiedLauncher();
  await launcher.exit();
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Received SIGTERM, shutting down gracefully...');
  const launcher = new UnifiedLauncher();
  await launcher.exit();
});

// Run launcher if this file is executed directly
if (require.main === module) {
  const launcher = new UnifiedLauncher();
  launcher.start().catch(error => {
    console.error('❌ Launcher Error:', error);
    process.exit(1);
  });
}

module.exports = UnifiedLauncher; 