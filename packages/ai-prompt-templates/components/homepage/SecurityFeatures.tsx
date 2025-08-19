'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface SecurityFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'authentication' | 'authorization' | 'data-protection' | 'threat-prevention';
  status: 'active' | 'monitoring' | 'alert' | 'disabled';
  lastUpdated: string;
  compliance: string[];
}

interface SecurityAlert {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  timestamp: string;
  isResolved: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface ComplianceStatus {
  standard: string;
  status: 'compliant' | 'partial' | 'non-compliant';
  lastAudit: string;
  nextAudit: string;
  score: number;
}

interface SecurityMetric {
  name: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  unit: string;
  trend: 'up' | 'down' | 'stable';
}

export default function SecurityFeatures() {
  const router = useRouter();
  const [securityFeatures, setSecurityFeatures] = useState<SecurityFeature[]>([]);
  const [securityAlerts, setSecurityAlerts] = useState<SecurityAlert[]>([]);
  const [complianceStatus, setComplianceStatus] = useState<ComplianceStatus[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetric[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'alerts' | 'compliance' | 'settings'>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const fetchSecurityData = async () => {
    try {
      // Mock data - in production this would come from v_security_features and v_security_alerts views
      const mockFeatures: SecurityFeature[] = [
        {
          id: '1',
          name: 'Multi-Factor Authentication',
          description: 'TOTP-based 2FA with backup codes and hardware key support',
          icon: '🔐',
          category: 'authentication',
          status: 'active',
          lastUpdated: '2024-02-01',
          compliance: ['GDPR', 'SOC2', 'ISO27001']
        },
        {
          id: '2',
          name: 'Role-Based Access Control',
          description: 'Granular permissions based on user roles and responsibilities',
          icon: '👥',
          category: 'authorization',
          status: 'active',
          lastUpdated: '2024-01-28',
          compliance: ['SOC2', 'ISO27001']
        },
        {
          id: '3',
          name: 'Data Encryption at Rest',
          description: 'AES-256 encryption for all stored data with key rotation',
          icon: '🔒',
          category: 'data-protection',
          status: 'active',
          lastUpdated: '2024-02-01',
          compliance: ['GDPR', 'SOC2', 'ISO27001', 'HIPAA']
        },
        {
          id: '4',
          name: 'Rate Limiting',
          description: 'DDoS protection and API rate limiting with adaptive thresholds',
          icon: '🛡️',
          category: 'threat-prevention',
          status: 'monitoring',
          lastUpdated: '2024-01-30',
          compliance: ['SOC2']
        },
        {
          id: '5',
          name: 'Audit Logging',
          description: 'Comprehensive logging of all security-relevant events',
          icon: '📋',
          category: 'authorization',
          status: 'active',
          lastUpdated: '2024-01-25',
          compliance: ['GDPR', 'SOC2', 'ISO27001', 'SOX']
        },
        {
          id: '6',
          name: 'Vulnerability Scanning',
          description: 'Automated security scanning and dependency analysis',
          icon: '🔍',
          category: 'threat-prevention',
          status: 'monitoring',
          lastUpdated: '2024-02-01',
          compliance: ['SOC2', 'ISO27001']
        }
      ];

      const mockAlerts: SecurityAlert[] = [
        {
          id: '1',
          type: 'info',
          title: 'Security Update Available',
          description: 'New security patches are available for your system',
          timestamp: '2024-02-01T10:30:00Z',
          isResolved: false,
          severity: 'low'
        },
        {
          id: '2',
          type: 'warning',
          title: 'Unusual Login Activity',
          description: 'Multiple failed login attempts detected from new IP address',
          timestamp: '2024-02-01T09:15:00Z',
          isResolved: false,
          severity: 'medium'
        },
        {
          id: '3',
          type: 'critical',
          title: 'Data Breach Attempt',
          description: 'Suspicious activity detected in data access patterns',
          timestamp: '2024-02-01T08:45:00Z',
          isResolved: true,
          severity: 'high'
        }
      ];

      const mockCompliance: ComplianceStatus[] = [
        {
          standard: 'GDPR',
          status: 'compliant',
          lastAudit: '2024-01-15',
          nextAudit: '2024-07-15',
          score: 95
        },
        {
          standard: 'SOC2 Type II',
          status: 'compliant',
          lastAudit: '2023-12-01',
          nextAudit: '2024-12-01',
          score: 92
        },
        {
          standard: 'ISO27001',
          status: 'partial',
          lastAudit: '2024-01-01',
          nextAudit: '2024-04-01',
          score: 78
        },
        {
          standard: 'HIPAA',
          status: 'compliant',
          lastAudit: '2024-01-20',
          nextAudit: '2024-07-20',
          score: 88
        }
      ];

      const mockMetrics: SecurityMetric[] = [
        {
          name: 'Security Score',
          value: 92,
          change: 3,
          changeType: 'increase',
          unit: '%',
          trend: 'up'
        },
        {
          name: 'Threats Blocked',
          value: 1247,
          change: -12,
          changeType: 'decrease',
          unit: 'threats',
          trend: 'down'
        },
        {
          name: 'Vulnerabilities',
          value: 3,
          change: 0,
          changeType: 'stable',
          unit: 'open',
          trend: 'stable'
        },
        {
          name: 'Incident Response',
          value: 2.3,
          change: -0.5,
          changeType: 'decrease',
          unit: 'hours',
          trend: 'down'
        }
      ];

      setSecurityFeatures(mockFeatures);
      setSecurityAlerts(mockAlerts);
      setComplianceStatus(mockCompliance);
      setSecurityMetrics(mockMetrics);
    } catch (error) {
      console.error('Failed to fetch security data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'monitoring': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'alert': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'disabled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'authentication': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'authorization': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'data-protection': return 'bg-green-100 text-green-800 border-green-200';
      case 'threat-prevention': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlertTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-orange-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getComplianceStatusColor = (status: string) => {
    switch (status) {
      case 'compliant': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'non-compliant': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const resolveAlert = (alertId: string) => {
    setSecurityAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isResolved: true } : alert
    ));
  };

  if (loading) {
    return (
      <section className="px-4 py-16 mx-auto max-w-7xl">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <div className="text-xl text-gray-600">Loading security features...</div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-16 mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          🔒 Security Features
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Enterprise-grade security with comprehensive threat protection and compliance
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-xl p-1 shadow-lg border border-gray-200">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'alerts', label: 'Alerts', icon: '🚨' },
            { id: 'compliance', label: 'Compliance', icon: '✅' },
            { id: 'settings', label: 'Settings', icon: '⚙️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Security Overview</h3>
            
            {/* Security Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {securityMetrics.map((metric, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <h4 className="text-lg font-semibold text-gray-800 mb-4">{metric.name}</h4>
                  
                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {metric.value}
                      <span className="text-lg text-gray-500 ml-1">{metric.unit}</span>
                    </div>
                    <div className={`text-sm font-medium ${
                      metric.changeType === 'increase' ? 'text-green-600' :
                      metric.changeType === 'decrease' ? 'text-red-600' : 'text-gray-600'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change} from last month
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <span className={`text-2xl ${
                      metric.trend === 'up' ? 'text-green-500' :
                      metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                    }`}>
                      {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {securityFeatures.map((feature) => (
                <div key={feature.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-3xl">{feature.icon}</div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(feature.status)}`}>
                      {feature.status}
                    </span>
                  </div>
                  
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{feature.name}</h4>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  
                  <div className="mb-4">
                    <div className="text-sm font-medium text-gray-700 mb-2">Compliance:</div>
                    <div className="flex flex-wrap gap-2">
                      {feature.compliance.map((standard, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md">
                          {standard}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(feature.category)}`}>
                      {feature.category}
                    </span>
                    <div className="text-xs text-gray-500">
                      Updated: {new Date(feature.lastUpdated).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'alerts' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Security Alerts</h3>
            <div className="space-y-6">
              {securityAlerts.map((alert) => (
                <div key={alert.id} className={`bg-gradient-to-r from-gray-50 to-white rounded-2xl p-6 border-2 transition-all duration-300 ${
                  alert.isResolved ? 'border-green-200 opacity-75' : 'border-red-200'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getAlertTypeColor(alert.type)}`}>
                          {alert.type.toUpperCase()}
                        </span>
                        <span className={`text-sm font-medium ${getSeverityColor(alert.severity)}`}>
                          {alert.severity.toUpperCase()} SEVERITY
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                      </div>
                      
                      <h4 className="text-xl font-semibold text-gray-800 mb-2">{alert.title}</h4>
                      <p className="text-gray-600 mb-4">{alert.description}</p>
                    </div>
                    
                    <div className="ml-6">
                      {!alert.isResolved ? (
                        <button
                          onClick={() => resolveAlert(alert.id)}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors duration-200"
                        >
                          Resolve
                        </button>
                      ) : (
                        <span className="px-4 py-2 bg-green-100 text-green-800 rounded-lg font-medium">
                          Resolved ✓
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'compliance' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Compliance Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {complianceStatus.map((compliance, index) => (
                <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-800">{compliance.standard}</h4>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getComplianceStatusColor(compliance.status)}`}>
                      {compliance.status}
                    </span>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Compliance Score</span>
                      <span className="text-lg font-bold text-gray-900">{compliance.score}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          compliance.score >= 90 ? 'bg-green-500' :
                          compliance.score >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${compliance.score}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div>Last Audit: {new Date(compliance.lastAudit).toLocaleDateString()}</div>
                    <div>Next Audit: {new Date(compliance.nextAudit).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div>
            <h3 className="text-2xl font-bold text-gray-800 mb-6">Security Settings</h3>
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-4xl">⚙️</span>
              </div>
              <h4 className="text-xl font-semibold text-gray-800 mb-2">Security Settings</h4>
              <p className="text-gray-600 mb-6">
                Advanced security configuration options
              </p>
              <button
                onClick={() => router.push('/studio/security')}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200"
              >
                Configure Security
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Security Actions */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🔍</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Security Audit</h4>
          <p className="text-gray-600 mb-4">Run comprehensive security assessment</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200">
            Run Audit
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">📊</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Compliance Report</h4>
          <p className="text-gray-600 mb-4">Generate compliance documentation</p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors duration-200">
            Generate Report
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🛡️</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Threat Intelligence</h4>
          <p className="text-gray-600 mb-4">Access latest threat information</p>
          <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors duration-200">
            View Threats
          </button>
        </div>
      </div>
    </section>
  );
}
