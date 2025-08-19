'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  unit: string;
  trend: number[];
  period: string;
}

interface PerformanceData {
  date: string;
  views: number;
  unlocks: number;
  conversions: number;
  revenue: number;
}

interface NeuronPerformance {
  id: string;
  title: string;
  views_14d: number;
  unlocks_14d: number;
  conversion_rate: number;
  revenue_generated: number;
  tier: 'free' | 'architect' | 'initiate' | 'elite';
}

export default function AdvancedAnalytics() {
  const router = useRouter();
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [performanceData, setPerformanceData] = useState<PerformanceData[]>([]);
  const [topNeurons, setTopNeurons] = useState<NeuronPerformance[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '14d' | '30d' | '90d'>('14d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsData();
  }, [selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      // Mock data - in production this would come from v_analytics_public and v_ua_popularity_14d views
      const mockMetrics: AnalyticsMetric[] = [
        {
          id: '1',
          name: 'Total Views',
          value: 15420,
          change: 12.5,
          changeType: 'increase',
          unit: 'views',
          trend: [12000, 13200, 14100, 15420],
          period: '14 days'
        },
        {
          id: '2',
          name: 'Unlock Rate',
          value: 23.4,
          change: 5.2,
          changeType: 'increase',
          unit: '%',
          trend: [18.2, 19.1, 21.3, 23.4],
          period: '14 days'
        },
        {
          id: '3',
          name: 'Conversion Rate',
          value: 8.7,
          change: -1.2,
          changeType: 'decrease',
          unit: '%',
          trend: [9.9, 9.1, 8.9, 8.7],
          period: '14 days'
        },
        {
          id: '4',
          name: 'Revenue',
          value: 2847,
          change: 18.9,
          changeType: 'increase',
          unit: '€',
          trend: [2395, 2520, 2680, 2847],
          period: '14 days'
        }
      ];

      const mockPerformanceData: PerformanceData[] = [
        { date: '2024-02-01', views: 1200, unlocks: 280, conversions: 95, revenue: 180 },
        { date: '2024-02-02', views: 1350, unlocks: 315, conversions: 102, revenue: 195 },
        { date: '2024-02-03', views: 1100, unlocks: 260, conversions: 88, revenue: 165 },
        { date: '2024-02-04', views: 1400, unlocks: 330, conversions: 110, revenue: 210 },
        { date: '2024-02-05', views: 1250, unlocks: 295, conversions: 98, revenue: 185 },
        { date: '2024-02-06', views: 1300, unlocks: 305, conversions: 105, revenue: 200 },
        { date: '2024-02-07', views: 1450, unlocks: 340, conversions: 115, revenue: 220 }
      ];

      const mockTopNeurons: NeuronPerformance[] = [
        {
          id: '1',
          title: 'Advanced Cognitive Architecture Framework',
          views_14d: 1240,
          unlocks_14d: 89,
          conversion_rate: 7.2,
          revenue_generated: 267,
          tier: 'elite'
        },
        {
          id: '2',
          title: 'Prompt Engineering Masterclass',
          views_14d: 980,
          unlocks_14d: 67,
          conversion_rate: 6.8,
          revenue_generated: 201,
          tier: 'initiate'
        },
        {
          id: '3',
          title: 'AI Ethics & Responsible Development',
          views_14d: 850,
          unlocks_14d: 58,
          conversion_rate: 6.8,
          revenue_generated: 174,
          tier: 'architect'
        },
        {
          id: '4',
          title: 'Neural Network Optimization Patterns',
          views_14d: 720,
          unlocks_14d: 45,
          conversion_rate: 6.3,
          revenue_generated: 135,
          tier: 'elite'
        }
      ];

      setMetrics(mockMetrics);
      setPerformanceData(mockPerformanceData);
      setTopNeurons(mockTopNeurons);
    } catch (error) {
      console.error('Failed to fetch analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getChangeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase': return 'text-green-600';
      case 'decrease': return 'text-red-600';
      case 'stable': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase': return '↗';
      case 'decrease': return '↘';
      case 'stable': return '→';
      default: return '→';
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'elite': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'initiate': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'architect': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'free': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <section className="px-4 py-16 mx-auto max-w-7xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Loading analytics data...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-16 mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          📊 Advanced Analytics Dashboard
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Real-time insights into platform performance and user engagement
        </p>
      </div>

      {/* Period Selector */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
          {[
            { id: '7d', label: '7 Days' },
            { id: '14d', label: '14 Days' },
            { id: '30d', label: '30 Days' },
            { id: '90d', label: '90 Days' }
          ].map((period) => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                selectedPeriod === period.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {metrics.map((metric) => (
          <div key={metric.id} className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">{metric.name}</h3>
              <div className={`text-sm font-medium ${getChangeColor(metric.changeType)}`}>
                <span className="mr-1">{getChangeIcon(metric.changeType)}</span>
                {metric.change > 0 ? '+' : ''}{metric.change}%
              </div>
            </div>
            
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {formatNumber(metric.value)}
              <span className="text-lg text-gray-500 ml-1">{metric.unit}</span>
            </div>
            
            <div className="text-sm text-gray-600">
              {metric.period} trend
            </div>
            
            {/* Mini Trend Chart */}
            <div className="mt-4 flex items-end gap-1 h-12">
              {metric.trend.map((value, index) => {
                const maxValue = Math.max(...metric.trend);
                const height = (value / maxValue) * 100;
                return (
                  <div
                    key={index}
                    className="flex-1 bg-gradient-to-t from-blue-500 to-blue-300 rounded-t"
                    style={{ height: `${height}%` }}
                  />
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Views & Unlocks Chart */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Views & Unlocks</h3>
          <div className="space-y-4">
            {performanceData.map((data, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 text-sm text-gray-600">
                    {new Date(data.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{formatNumber(data.views)} views</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-gray-700">{formatNumber(data.unlocks)} unlocks</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-800">{formatNumber(data.conversions)} conversions</div>
                  <div className="text-xs text-gray-500">€{data.revenue}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="text-xl font-semibold text-gray-800 mb-6">Conversion Funnel</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Total Views</span>
              <span className="font-semibold text-gray-900">{formatNumber(performanceData.reduce((sum, d) => sum + d.views, 0))}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Unlocks</span>
              <span className="font-semibold text-gray-900">{formatNumber(performanceData.reduce((sum, d) => sum + d.unlocks, 0))}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ 
                  width: `${(performanceData.reduce((sum, d) => sum + d.unlocks, 0) / performanceData.reduce((sum, d) => sum + d.views, 0)) * 100}%` 
                }}></div>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-gray-700">Conversions</span>
              <span className="font-semibold text-gray-900">{formatNumber(performanceData.reduce((sum, d) => sum + d.conversions, 0))}</span>
            </div>
            <div className="relative">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ 
                  width: `${(performanceData.reduce((sum, d) => sum + d.conversions, 0) / performanceData.reduce((sum, d) => sum + d.unlocks, 0)) * 100}%` 
                }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Top Performing Neurons */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Top Performing Neurons</h3>
          <button
            onClick={() => router.push('/studio/analytics')}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            View All →
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-700">Neuron</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Tier</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Views (14d)</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Unlocks (14d)</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Conv. Rate</th>
                <th className="text-center py-3 px-4 font-medium text-gray-700">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {topNeurons.map((neuron) => (
                <tr key={neuron.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <td className="py-4 px-4">
                    <div className="max-w-xs">
                      <div className="font-medium text-gray-900 truncate">{neuron.title}</div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTierColor(neuron.tier)}`}>
                      {neuron.tier}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center text-gray-700">{formatNumber(neuron.views_14d)}</td>
                  <td className="py-4 px-4 text-center text-gray-700">{formatNumber(neuron.unlocks_14d)}</td>
                  <td className="py-4 px-4 text-center text-gray-700">{neuron.conversion_rate}%</td>
                  <td className="py-4 px-4 text-center font-medium text-gray-900">€{neuron.revenue_generated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Analytics Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">📈</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Export Reports</h4>
          <p className="text-gray-600 mb-4">Download detailed analytics reports in multiple formats</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200">
            Export Data
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🎯</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Set Goals</h4>
          <p className="text-gray-600 mb-4">Configure performance targets and track progress</p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors duration-200">
            Configure Goals
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🔔</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Alerts</h4>
          <p className="text-gray-600 mb-4">Set up notifications for key performance indicators</p>
          <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors duration-200">
            Manage Alerts
          </button>
        </div>
      </div>
    </section>
  );
}
