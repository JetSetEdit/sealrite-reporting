import React from 'react';

const MetricCard = ({ label, value, icon: Icon, color, change, changeType, target, status, details }) => {
  const getColorClasses = (color) => {
    switch (color) {
      case 'facebook':
        return 'text-facebook bg-facebook/10';
      case 'instagram':
        return 'text-instagram bg-instagram/10';
      case 'blue':
        return 'text-blue-600 bg-blue-100';
      case 'green':
        return 'text-green-600 bg-green-100';
      case 'orange':
        return 'text-orange-600 bg-orange-100';
      case 'purple':
        return 'text-purple-600 bg-purple-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'met':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✅ Met</span>;
      case 'not-met':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">⚠️ Not Met</span>;
      case 'info':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">ℹ️ Info</span>;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${getColorClasses(color)}`}>
          <Icon className="h-6 w-6" />
        </div>
        {status && getStatusBadge(status)}
      </div>
      
      <div>
        <p className="text-sm font-medium text-gray-600 mb-1">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
        
        {target && (
          <p className="text-xs text-gray-500 mb-1">Target: {target}</p>
        )}
        
        {details && (
          <p className="text-xs text-gray-500">{details}</p>
        )}
        
        {change && (
          <p className={`text-sm font-medium ${changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
            {changeType === 'positive' ? '+' : ''}{change}%
          </p>
        )}
      </div>
    </div>
  );
};

export default MetricCard; 