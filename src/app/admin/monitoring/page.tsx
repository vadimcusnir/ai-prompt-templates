'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { usePerformanceMonitor } from '@/hooks/usePerformanceMonitor'
import { 
  Activity, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Clock, 
  Database,
  Server,
  Globe
} from 'lucide-react'

interface SystemMetrics {
  users: {
    total: number
    active: number
    new: number
  }
  performance: {
    avgResponseTime: number
    errorRate: number
    uptime: number
  }
  analytics: {
    pageViews: number
    uniqueVisitors: number
    conversionRate: number
  }
  system: {
    cpuUsage: number
    memoryUsage: number
    diskUsage: number
  }
}

export default function MonitoringPage() {
  const { user, userTier } = useAuth()
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30) // seconds
  const [autoRefresh, setAutoRefresh] = useState(true)

  const { metrics: performanceMetrics, getPerformanceScore } = usePerformanceMonitor({
    enabled: true,
    logToConsole: false,
    onThresholdExceeded: (metric, value, threshold) => {
      console.warn(`Performance threshold exceeded: ${metric} = ${value} (threshold: ${threshold})`)
    }
  })

  // Check admin access
  useEffect(() => {
    if (user && userTier !== 'admin') {
      window.location.href = '/403'
    }
  }, [user, userTier])

  // Fetch system metrics
  const fetchMetrics = async () => {
    try {
      setLoading(true)
      
      // Simulate API call - replace with actual metrics endpoint
      const mockMetrics: SystemMetrics = {
        users: {
          total: 1250,
          active: 89,
          new: 12
        },
        performance: {
          avgResponseTime: 245,
          errorRate: 0.8,
          uptime: 99.9
        },
        analytics: {
          pageViews: 15420,
          uniqueVisitors: 2340,
          conversionRate: 3.2
        },
        system: {
          cpuUsage: 45,
          memoryUsage: 67,
          diskUsage: 23
        }
      }

      // Add some randomness for demo
      mockMetrics.performance.avgResponseTime += Math.random() * 50 - 25
      mockMetrics.analytics.pageViews += Math.floor(Math.random() * 1000 - 500)
      mockMetrics.system.cpuUsage += Math.random() * 10 - 5

      setMetrics(mockMetrics)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh) return

    fetchMetrics()
    const interval = setInterval(fetchMetrics, refreshInterval * 1000)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  // Initial fetch
  useEffect(() => {
    fetchMetrics()
  }, [])

  if (!user || userTier !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Acces Restricționat</h1>
          <p className="text-gray-600">Nu aveți permisiunea de a accesa această pagină.</p>
        </div>
      </div>
    )
  }

  const performanceScore = getPerformanceScore()

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard de Monitoring</h1>
          <p className="text-gray-600">Monitorizare în timp real a performanței și utilizării sistemului</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
          <div className="flex items-center space-x-4">
            <Button
              onClick={fetchMetrics}
              disabled={loading}
              loading={loading}
            >
              Actualizează
            </Button>
            
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              <span className="text-sm text-gray-600">Auto-refresh</span>
            </label>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Interval:</span>
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>1m</option>
              <option value={300}>5m</option>
            </select>
          </div>
        </div>

        {/* Performance Score */}
        <div className="mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Scor Performanță</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <div className={`text-4xl font-bold ${
                    performanceScore.score >= 90 ? 'text-green-600' :
                    performanceScore.score >= 70 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {performanceScore.score}/100
                  </div>
                  <div className="text-sm text-gray-600">Scor General</div>
                </div>
                
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    {performanceScore.issues}
                  </div>
                  <div className="text-sm text-gray-600">Probleme Identificate</div>
                </div>

                <div className="flex-1">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        performanceScore.score >= 90 ? 'bg-green-600' :
                        performanceScore.score >= 70 ? 'bg-yellow-600' : 'bg-red-600'
                      }`}
                      style={{ width: `${performanceScore.score}%` }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Users */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Utilizatori</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.users.total.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                +{metrics?.users.new} noi această săptămână
              </p>
            </CardContent>
          </Card>

          {/* Performance */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timp Răspuns</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.performance.avgResponseTime}ms</div>
              <p className="text-xs text-muted-foreground">
                Uptime: {metrics?.performance.uptime}%
              </p>
            </CardContent>
          </Card>

          {/* Analytics */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vizualizări</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.analytics.pageViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {metrics?.analytics.uniqueVisitors} vizitatori unici
              </p>
            </CardContent>
          </Card>

          {/* System */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">CPU</CardTitle>
              <Server className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics?.system.cpuUsage}%</div>
              <p className="text-xs text-muted-foreground">
                Memorie: {metrics?.system.memoryUsage}%
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Performance Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Metrici Performanță</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">FCP (First Contentful Paint)</span>
                  <span className="font-medium">
                    {performanceMetrics.fcp ? `${performanceMetrics.fcp.toFixed(0)}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">LCP (Largest Contentful Paint)</span>
                  <span className="font-medium">
                    {performanceMetrics.lcp ? `${performanceMetrics.lcp.toFixed(0)}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">FID (First Input Delay)</span>
                  <span className="font-medium">
                    {performanceMetrics.fid ? `${performanceMetrics.fid.toFixed(0)}ms` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">CLS (Cumulative Layout Shift)</span>
                  <span className="font-medium">
                    {performanceMetrics.cls ? performanceMetrics.cls.toFixed(3) : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">TTFB (Time to First Byte)</span>
                  <span className="font-medium">
                    {performanceMetrics.ttfb ? `${performanceMetrics.ttfb.toFixed(0)}ms` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle>Sănătatea Sistemului</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Status API</span>
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Operațional</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Conectat</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Storage</span>
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-sm text-yellow-600">67% Utilizat</span>
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Rate Limiting</span>
                  <span className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm text-green-600">Normal</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts */}
        <div className="mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span>Alerte Active</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800">
                      Utilizarea memoriei este ridicată (67%)
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    Rezolvă
                  </Button>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Database className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-800">
                      Backup automat programat pentru 02:00
                    </span>
                  </div>
                  <Button size="sm" variant="outline">
                    Detalii
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
