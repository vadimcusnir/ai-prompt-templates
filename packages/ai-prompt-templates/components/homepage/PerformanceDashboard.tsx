'use client';

import { useState, useEffect } from 'react';

interface MetricData {
  label: string;
  value: number;
  unit: string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  color: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
  }[];
}

const PERFORMANCE_METRICS: MetricData[] = [
  {
    label: 'Active Users',
    value: 1247,
    unit: 'users',
    change: 12.5,
    trend: 'up',
    color: 'blue'
  },
  {
    label: 'Framework Usage',
    value: 89.2,
    unit: '%',
    change: 8.3,
    trend: 'up',
    color: 'green'
  },
  {
    label: 'Response Time',
    value: 1.8,
    unit: 'ms',
    change: -15.2,
    trend: 'down',
    color: 'purple'
  },
  {
    label: 'Success Rate',
    value: 99.7,
    unit: '%',
    change: 0.3,
    trend: 'up',
    color: 'green'
  },
  {
    label: 'API Calls',
    value: 45678,
    unit: 'calls',
    change: 23.1,
    trend: 'up',
    color: 'blue'
  },
  {
    label: 'Error Rate',
    value: 0.3,
    unit: '%',
    change: -25.0,
    trend: 'down',
    color: 'green'
  }
];

const MONTHLY_DATA: ChartData = {
  labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  datasets: [
    {
      label: 'User Growth',
      data: [120, 180, 250, 320, 400, 480, 550, 620, 700, 800, 900, 1000],
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4
    },
    {
      label: 'Framework Usage',
      data: [65, 72, 78, 82, 85, 88, 90, 89, 91, 93, 95, 97],
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)',
      tension: 0.4
    }
  ]
};

const REAL_TIME_ACTIVITY = [
  { user: 'Sarah J.', action: 'Accessed Cognitive Depth Framework', time: '2 min ago', type: 'access' },
  { user: 'Mike R.', action: 'Downloaded Meaning Engineering PDF', time: '5 min ago', type: 'download' },
  { user: 'Emma L.', action: 'Started Interactive Demo', time: '8 min ago', type: 'demo' },
  { user: 'David K.', action: 'Upgraded to Architect Plan', time: '12 min ago', type: 'upgrade' },
  { user: 'Lisa M.', action: 'Shared Framework with Team', time: '15 min ago', type: 'share' }
];

export default function PerformanceDashboard() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedMetric, setSelectedMetric] = useState<MetricData | null>(null);
  const [showDetailedChart, setShowDetailedChart] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const getTrendIcon = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return '↗️';
      case 'down':
        return '↘️';
      case 'stable':
        return '→';
    }
  };

  const getTrendColor = (trend: 'up' | 'down' | 'stable') => {
    switch (trend) {
      case 'up':
        return 'text-green-600';
      case 'down':
        return 'text-red-600';
      case 'stable':
        return 'text-gray-600';
    }
  };

  const getMetricColor = (color: string) => {
    switch (color) {
      case 'blue':
        return 'bg-blue-500';
      case 'green':
        return 'bg-green-500';
      case 'purple':
        return 'bg-purple-500';
      case 'orange':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-900 via-blue-900 to-indigo-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            📊 Performance Metrics Dashboard
          </h2>
          <p className="text-xl text-blue-100 max-w-3xl mx-auto">
            Real-time insights into platform performance, user engagement, and system health.
          </p>
          <div className="mt-4 text-blue-200 text-sm">
            Last updated: {currentTime.toLocaleTimeString()}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {PERFORMANCE_METRICS.map((metric) => (
            <div
              key={metric.label}
              className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all duration-300 cursor-pointer group"
              onClick={() => setSelectedMetric(metric)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${getMetricColor(metric.color)} flex items-center justify-center`}>
                  <span className="text-white text-xl">📈</span>
                </div>
                <div className={`text-right ${getTrendColor(metric.trend)}`}>
                  <div className="text-sm font-medium">
                    {getTrendIcon(metric.trend)} {metric.change > 0 ? '+' : ''}{metric.change}%
                  </div>
                  <div className="text-xs opacity-75">vs last month</div>
                </div>
              </div>
              
              <div className="mb-2">
                <div className="text-3xl font-bold text-white">
                  {formatNumber(metric.value)}
                </div>
                <div className="text-blue-200 text-sm">
                  {metric.unit}
                </div>
              </div>
              
              <div className="text-blue-100 text-sm font-medium">
                {metric.label}
              </div>
            </div>
          ))}
        </div>

        {/* Performance Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          {/* User Growth Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-6">User Growth Trend</h3>
            <div className="h-64 flex items-end justify-between">
              {MONTHLY_DATA.datasets[0].data.map((value, index) => (
                <div key={index} className="flex flex-col items-center">
                  <div 
                    className="w-8 bg-blue-500 rounded-t-sm transition-all duration-300 hover:bg-blue-400"
                    style={{ height: `${(value / 1000) * 200}px` }}
                  ></div>
                  <div className="text-xs text-blue-200 mt-2">
                    {MONTHLY_DATA.labels[index]}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-center">
              <div className="text-2xl font-bold text-white">
                {formatNumber(MONTHLY_DATA.datasets[0].data[MONTHLY_DATA.datasets[0].data.length - 1])}
              </div>
              <div className="text-blue-200 text-sm">Current Active Users</div>
            </div>
          </div>

          {/* Framework Usage Chart */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold mb-6">Framework Usage Rate</h3>
            <div className="h-64 flex items-center justify-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full border-8 border-blue-500 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {MONTHLY_DATA.datasets[1].data[MONTHLY_DATA.datasets[1].data.length - 1]}%
                    </div>
                    <div className="text-blue-200 text-sm">Usage Rate</div>
                  </div>
                </div>
                <div className="absolute inset-0 w-32 h-32 rounded-full border-8 border-transparent border-t-green-500 border-r-purple-500 border-b-orange-500 transform rotate-45"></div>
              </div>
            </div>
            <div className="mt-4 text-center text-blue-200 text-sm">
              Average across all frameworks
            </div>
          </div>
        </div>

        {/* Real-time Activity Feed */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-16">
          <h3 className="text-xl font-bold mb-6">Real-time Activity</h3>
          <div className="space-y-4">
            {REAL_TIME_ACTIVITY.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    activity.type === 'access' ? 'bg-blue-500' :
                    activity.type === 'download' ? 'bg-green-500' :
                    activity.type === 'demo' ? 'bg-purple-500' :
                    activity.type === 'upgrade' ? 'bg-orange-500' :
                    'bg-gray-500'
                  }`}></div>
                  <div>
                    <div className="text-white font-medium">{activity.user}</div>
                    <div className="text-blue-200 text-sm">{activity.action}</div>
                  </div>
                </div>
                <div className="text-blue-200 text-sm">{activity.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Performance Comparison */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
          <h3 className="text-xl font-bold mb-6">Performance Comparison</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-3xl font-bold text-green-400 mb-2">99.7%</div>
              <div className="text-blue-200 text-sm">Uptime</div>
              <div className="text-green-400 text-xs mt-1">+0.2% vs last month</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-3xl font-bold text-blue-400 mb-2">1.8ms</div>
              <div className="text-blue-200 text-sm">Response Time</div>
              <div className="text-green-400 text-xs mt-1">-15.2% vs last month</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-3xl font-bold text-purple-400 mb-2">456K</div>
              <div className="text-blue-200 text-sm">API Calls</div>
              <div className="text-green-400 text-xs mt-1">+23.1% vs last month</div>
            </div>
          </div>
        </div>

        {/* Metric Detail Modal */}
        {selectedMetric && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-600">
              <div className="p-6 border-b border-gray-600">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-bold text-white">
                    {selectedMetric.label} Details
                  </h3>
                  <button
                    onClick={() => setSelectedMetric(null)}
                    className="text-gray-400 hover:text-white transition-colors duration-200"
                  >
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-300 mb-1">Current Value</div>
                    <div className="text-2xl font-bold text-white">
                      {formatNumber(selectedMetric.value)} {selectedMetric.unit}
                    </div>
                  </div>
                  <div className="bg-gray-700 p-4 rounded-lg">
                    <div className="text-sm font-medium text-gray-300 mb-1">Monthly Change</div>
                    <div className={`text-2xl font-bold ${getTrendColor(selectedMetric.trend)}`}>
                      {getTrendIcon(selectedMetric.trend)} {selectedMetric.change > 0 ? '+' : ''}{selectedMetric.change}%
                    </div>
                  </div>
                </div>

                <div className="bg-gray-700 p-4 rounded-lg mb-6">
                  <h4 className="font-semibold text-white mb-3">Historical Trend</h4>
                  <div className="h-32 bg-gray-800 rounded-lg flex items-end justify-center">
                    <div className="text-gray-400 text-sm">Chart visualization would go here</div>
                  </div>
                </div>

                <div className="text-gray-300 text-sm leading-relaxed">
                  This metric represents the {selectedMetric.label.toLowerCase()} of the platform. 
                  The {selectedMetric.change > 0 ? 'increase' : 'decrease'} of {Math.abs(selectedMetric.change)}% 
                  indicates {selectedMetric.change > 0 ? 'improved' : 'declining'} performance compared to last month.
                </div>
              </div>

              <div className="p-6 border-t border-gray-600 bg-gray-700">
                <div className="flex justify-end">
                  <button
                    onClick={() => setSelectedMetric(null)}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
