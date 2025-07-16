import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';
import { formatNumber } from '../utils/formatters';

const ChartComponent = ({ data, type }) => {

  const getChartData = () => {
    const chartData = [];

    // Facebook data
    if (data?.facebook?.insights?.data) {
      data.facebook.insights.data.forEach(metric => {
        if (metric.values && metric.values.length > 0) {
          const value = metric.values[0].value;
          const existingData = chartData.find(item => item.name === 'Facebook');
          
          if (existingData) {
            existingData[metric.name] = value;
          } else {
            chartData.push({
              name: 'Facebook',
              [metric.name]: value
            });
          }
        }
      });
    }

    // Instagram data
    if (data?.instagram?.insights?.data) {
      data.instagram.insights.data.forEach(metric => {
        if (metric.values && metric.values.length > 0) {
          const value = metric.values[0].value;
          const existingData = chartData.find(item => item.name === 'Instagram');
          
          if (existingData) {
            existingData[metric.name] = value;
          } else {
            chartData.push({
              name: 'Instagram',
              [metric.name]: value
            });
          }
        }
      });
    }

    return chartData;
  };

  const chartData = getChartData();

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500">
        <p>No data available for chart</p>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatNumber(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  if (type === 'engagement') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatNumber} />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="page_engaged_users" fill="#3b82f6" name="Engaged Users" />
          <Bar dataKey="page_post_engagements" fill="#10b981" name="Post Engagements" />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (type === 'reach') {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={formatNumber} />
          <Tooltip content={<CustomTooltip />} />
          <Area 
            type="monotone" 
            dataKey="page_impressions" 
            stackId="1" 
            stroke="#3b82f6" 
            fill="#3b82f6" 
            name="Impressions" 
          />
          <Area 
            type="monotone" 
            dataKey="impressions" 
            stackId="1" 
            stroke="#e4405f" 
            fill="#e4405f" 
            name="Instagram Impressions" 
          />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis tickFormatter={formatNumber} />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="page_followers" 
          stroke="#1877f2" 
          strokeWidth={2}
          name="Followers" 
        />
        <Line 
          type="monotone" 
          dataKey="follower_count" 
          stroke="#e4405f" 
          strokeWidth={2}
          name="Instagram Followers" 
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default ChartComponent; 