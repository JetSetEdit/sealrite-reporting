import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  MessageCircle,
  Instagram,
  RefreshCw,
  Download,
  Target,
  Award,
  Calendar
} from 'lucide-react';

import MetricCard from './components/MetricCard';
import ChartComponent from './components/ChartComponent';
import DataTable from './components/DataTable';

function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(moment().format('YYYY-MM'));
  
  // Hardcoded for SealRite WSM by OptiSeal
  const OPTISEAL_PAGE_ID = '651877034666676';
  const PAGE_NAME = 'SealRite WSM by OptiSeal';

  const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

  // Generate month options for the last 12 months
  const getMonthOptions = () => {
    const options = [];
    for (let i = 0; i < 12; i++) {
      const date = moment().subtract(i, 'months');
      const value = date.format('YYYY-MM');
      const label = date.format('MMMM YYYY');
      options.push({ value, label });
    }
    return options;
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post(`${API_BASE_URL}/api/fetch-data`, {
        pageId: OPTISEAL_PAGE_ID,
        includeInstagram: true,
        month: selectedMonth
      });
      
      setData(response.data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/generate-report`, {
        pageId: OPTISEAL_PAGE_ID,
        pageName: PAGE_NAME,
        month: selectedMonth,
        data
      });
    
      alert('Report generated successfully!');
    } catch (err) {
      alert('Failed to generate report: ' + (err.response?.data?.message || err.message));
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth]); // Refetch when month changes

  const formatNumber = (num) => {
    if (!num) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getMetricValue = (insights, metricName) => {
    if (!insights?.data) return 0;
    const metric = insights.data.find(m => m.name === metricName);
    return metric?.values?.[0]?.value || 0;
  };

  // Contract-specific KPI calculations
  const getContractKPIs = () => {
    if (!data?.instagram?.kpis) return [];
    
    const kpis = data.instagram.kpis;
    
    return [
      {
        label: 'Follower Growth',
        value: `${kpis.followerGrowth.percentage}%`,
        target: '≥ 15%',
        status: kpis.followerGrowth.percentage >= 15 ? 'met' : 'not-met',
        icon: TrendingUp,
        color: kpis.followerGrowth.percentage >= 15 ? 'green' : 'orange',
        details: `${kpis.followerGrowth.startCount} → ${kpis.followerGrowth.endCount}`
      },
      {
        label: 'Engagement Rate',
        value: `${kpis.engagementRate.percentage}%`,
        target: '≥ 5%',
        status: kpis.engagementRate.percentage >= 5 ? 'met' : 'not-met',
        icon: Heart,
        color: kpis.engagementRate.percentage >= 5 ? 'green' : 'orange',
        details: `${kpis.engagementRate.totalLikes} likes + ${kpis.engagementRate.totalComments} comments`
      },
      {
        label: 'Profile Views',
        value: formatNumber(kpis.profileViews.total),
        target: 'Monthly',
        status: 'info',
        icon: Eye,
        color: 'blue',
        details: `${kpis.reportingPeriod.start} to ${kpis.reportingPeriod.end}`
      },
      {
        label: 'Total Reach',
        value: formatNumber(kpis.reach.total),
        target: 'Monthly',
        status: 'info',
        icon: BarChart3,
        color: 'purple',
        details: `${kpis.posts.count} posts`
      }
    ];
  };

  const contractKPIs = getContractKPIs();
  const monthOptions = getMonthOptions();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="bg-white p-2 rounded-lg">
                  <BarChart3 className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">SealRite WSM</h1>
                  <p className="text-blue-100 text-sm">by OptiSeal Australia</p>
                  <p className="text-blue-200 text-xs">📅 Agreement: May 22nd, 2025 | 📱 Instagram: March 2025</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Month Picker */}
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-white" />
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="px-3 py-2 bg-white bg-opacity-20 text-white rounded-lg border border-white border-opacity-30 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  {monthOptions.map((option) => (
                    <option key={option.value} value={option.value} className="text-gray-900">
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <button
                onClick={fetchData}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-white bg-opacity-20 text-white rounded-lg hover:bg-opacity-30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh Data</span>
              </button>
              
              <button
                onClick={generateReport}
                disabled={!data}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <Download className="h-4 w-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-600">Loading data for {moment(selectedMonth).format('MMMM YYYY')}...</span>
            </div>
          </div>
        )}

        {!data && !loading && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Welcome to SealRite WSM Analytics</h2>
            <p className="text-gray-600">Select a month and click "Refresh Data" to load the latest Instagram performance metrics.</p>
          </div>
        )}

        {data && !data.instagram && !loading && (
          <div className="text-center py-12">
            <Instagram className="h-16 w-16 text-pink-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Instagram Data Unavailable</h2>
            <p className="text-gray-600">Instagram data is not available for the selected month. This may be due to API limitations or no posts in this period.</p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4 max-w-md mx-auto">
              <p className="text-blue-800 text-sm font-medium mb-2">📅 Account Timeline:</p>
              <ul className="text-blue-700 text-sm space-y-1 text-left">
                <li>• <strong>March 2025:</strong> Instagram account created</li>
                <li>• <strong>May 22nd, 2025:</strong> Agreement effective date</li>
                <li>• <strong>Current:</strong> Account is actively growing</li>
              </ul>
            </div>
            <p className="text-gray-500 text-sm mt-4">Try selecting a month from March 2025 onwards for available data.</p>
          </div>
        )}

        {data && !loading && (
          <>
            {/* Last Updated */}
            {lastUpdated && (
              <div className="mb-6 text-sm text-gray-500">
                Last updated: {moment(lastUpdated).format('MMMM Do YYYY, h:mm:ss a')} for {moment(selectedMonth).format('MMMM YYYY')}
              </div>
            )}

            {/* Contract KPIs Section */}
            {contractKPIs.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center space-x-2 mb-6">
                  <Target className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold text-gray-900">Contract Performance KPIs</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {contractKPIs.map((metric, index) => (
                    <MetricCard key={index} {...metric} />
                  ))}
                </div>
              </div>
            )}

            {/* Bonus Eligibility Section */}
            {data?.instagram?.kpis && (
              <div className="mb-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center space-x-2 mb-4">
                    <Award className="h-6 w-6 text-yellow-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Bonus Eligibility Assessment</h3>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Follower Growth Target:</span>
                        <span className="text-sm font-semibold">≥ 15%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Current Performance:</span>
                        <span className={`text-sm font-semibold ${data.instagram.kpis.followerGrowth.percentage >= 15 ? 'text-green-600' : 'text-orange-600'}`}>
                          {data.instagram.kpis.followerGrowth.percentage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`text-sm font-semibold ${data.instagram.kpis.followerGrowth.percentage >= 15 ? 'text-green-600' : 'text-orange-600'}`}>
                          {data.instagram.kpis.followerGrowth.percentage >= 15 ? '✅ Target Met' : '⚠️ Target Not Met'}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Engagement Rate Target:</span>
                        <span className="text-sm font-semibold">≥ 5%</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Current Performance:</span>
                        <span className={`text-sm font-semibold ${data.instagram.kpis.engagementRate.percentage >= 5 ? 'text-green-600' : 'text-orange-600'}`}>
                          {data.instagram.kpis.engagementRate.percentage}%
                          {data.instagram.kpis.engagementRate.percentage > 100 && (
                            <span className="text-red-500 ml-1">⚠️</span>
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-gray-700">Status:</span>
                        <span className={`text-sm font-semibold ${data.instagram.kpis.engagementRate.percentage >= 5 ? 'text-green-600' : 'text-orange-600'}`}>
                          {data.instagram.kpis.engagementRate.percentage >= 5 ? '✅ Target Met' : '⚠️ Target Not Met'}
                        </span>
                      </div>
                      {data.instagram.kpis.engagementRate.percentage > 100 && (
                        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                          ⚠️ Unusually high engagement rate. This may indicate a follower count discrepancy or data aggregation issue.
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Note:</strong> Conversions/CTAs require manual input as they are not available via Instagram API.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Instagram Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <Instagram className="h-5 w-5 text-pink-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Instagram Engagement</h3>
                </div>
                <ChartComponent data={data} type="engagement" />
              </div>
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center space-x-2 mb-4">
                  <TrendingUp className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Reach & Profile Views</h3>
                </div>
                <ChartComponent data={data} type="reach" />
              </div>
            </div>

            {/* Recent Instagram Posts */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Instagram className="h-5 w-5 text-pink-600" />
                <h3 className="text-lg font-semibold text-gray-900">Recent Instagram Posts</h3>
              </div>
              <DataTable data={data} />
            </div>
          </>
        )}
      </main>
    </div>
  );
}

export default App; 