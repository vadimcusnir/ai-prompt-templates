'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  isSupported: boolean;
}

interface AccessibilityFeature {
  id: string;
  name: string;
  description: string;
  icon: string;
  isEnabled: boolean;
  category: 'visual' | 'auditory' | 'motor' | 'cognitive';
}

interface I18nContent {
  key: string;
  en: string;
  ro: string;
  de: string;
  fr: string;
}

export default function AccessibilityI18n() {
  const router = useRouter();
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [accessibilityFeatures, setAccessibilityFeatures] = useState<AccessibilityFeature[]>([]);
  const [i18nContent, setI18nContent] = useState<I18nContent[]>([]);
  const [fontSize, setFontSize] = useState<number>(16);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);
  const [showAccessibilityPanel, setShowAccessibilityPanel] = useState<boolean>(false);

  const languages: Language[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸', isSupported: true },
    { code: 'ro', name: 'Romanian', nativeName: 'Română', flag: '🇷🇴', isSupported: true },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', isSupported: true },
    { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', isSupported: true },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', isSupported: false },
    { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', isSupported: false }
  ];

  useEffect(() => {
    fetchAccessibilityData();
    fetchI18nContent();
    loadUserPreferences();
  }, []);

  useEffect(() => {
    applyAccessibilitySettings();
  }, [fontSize, highContrast, reducedMotion]);

  const fetchAccessibilityData = async () => {
    try {
      // Mock data - in production this would come from v_accessibility_features view
      const mockFeatures: AccessibilityFeature[] = [
        {
          id: '1',
          name: 'High Contrast Mode',
          description: 'Increase contrast for better visibility',
          icon: '🎨',
          isEnabled: highContrast,
          category: 'visual'
        },
        {
          id: '2',
          name: 'Large Text',
          description: 'Increase font size for better readability',
          icon: '🔍',
          isEnabled: fontSize > 16,
          category: 'visual'
        },
        {
          id: '3',
          name: 'Reduced Motion',
          description: 'Minimize animations and transitions',
          icon: '⏸️',
          isEnabled: reducedMotion,
          category: 'cognitive'
        },
        {
          id: '4',
          name: 'Keyboard Navigation',
          description: 'Full keyboard navigation support',
          icon: '⌨️',
          isEnabled: true,
          category: 'motor'
        },
        {
          id: '5',
          name: 'Screen Reader Support',
          description: 'Optimized for screen readers',
          icon: '📱',
          isEnabled: true,
          category: 'auditory'
        },
        {
          id: '6',
          name: 'Focus Indicators',
          description: 'Clear focus indicators for navigation',
          icon: '🎯',
          isEnabled: true,
          category: 'visual'
        }
      ];

      setAccessibilityFeatures(mockFeatures);
    } catch (error) {
      console.error('Failed to fetch accessibility data:', error);
    }
  };

  const fetchI18nContent = async () => {
    try {
      // Mock data - in production this would come from v_i18n_content view
      const mockContent: I18nContent[] = [
        {
          key: 'welcome_message',
          en: 'Welcome to AI Prompt Templates',
          ro: 'Bun venit la AI Prompt Templates',
          de: 'Willkommen bei AI Prompt Templates',
          fr: 'Bienvenue sur AI Prompt Templates'
        },
        {
          key: 'explore_library',
          en: 'Explore Cognitive Library',
          ro: 'Explorează Biblioteca Cognitivă',
          de: 'Kognitive Bibliothek erkunden',
          fr: 'Explorer la Bibliothèque Cognitive'
        },
        {
          key: 'view_pricing',
          en: 'View Pricing',
          ro: 'Vezi Prețurile',
          de: 'Preise anzeigen',
          fr: 'Voir les Prix'
        },
        {
          key: 'community_hub',
          en: 'Community Hub',
          ro: 'Centrul Comunității',
          de: 'Community-Hub',
          fr: 'Centre Communautaire'
        }
      ];

      setI18nContent(mockContent);
    } catch (error) {
      console.error('Failed to fetch i18n content:', error);
    }
  };

  const loadUserPreferences = () => {
    // Load user preferences from localStorage or user settings
    const savedFontSize = localStorage.getItem('fontSize');
    const savedHighContrast = localStorage.getItem('highContrast');
    const savedReducedMotion = localStorage.getItem('reducedMotion');
    const savedLanguage = localStorage.getItem('language');

    if (savedFontSize) setFontSize(parseInt(savedFontSize));
    if (savedHighContrast) setHighContrast(savedHighContrast === 'true');
    if (savedReducedMotion) setReducedMotion(savedReducedMotion === 'true');
    if (savedLanguage) setCurrentLanguage(savedLanguage);
  };

  const applyAccessibilitySettings = () => {
    // Apply accessibility settings to the document
    document.documentElement.style.fontSize = `${fontSize}px`;
    
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }
    
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }

    // Save preferences
    localStorage.setItem('fontSize', fontSize.toString());
    localStorage.setItem('highContrast', highContrast.toString());
    localStorage.setItem('reducedMotion', reducedMotion.toString());
  };

  const handleLanguageChange = (languageCode: string) => {
    setCurrentLanguage(languageCode);
    localStorage.setItem('language', languageCode);
    
    // In production: trigger language change event
    // window.dispatchEvent(new CustomEvent('languageChanged', { detail: languageCode }));
  };

  const getCurrentContent = (key: string) => {
    const content = i18nContent.find(item => item.key === key);
    if (!content) return key;
    
    switch (currentLanguage) {
      case 'ro': return content.ro;
      case 'de': return content.de;
      case 'fr': return content.fr;
      default: return content.en;
    }
  };

  const toggleAccessibilityFeature = (featureId: string) => {
    setAccessibilityFeatures(prev => prev.map(feature => 
      feature.id === featureId 
        ? { ...feature, isEnabled: !feature.isEnabled }
        : feature
    ));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'visual': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'auditory': return 'bg-green-100 text-green-800 border-green-200';
      case 'motor': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cognitive': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <section className="px-4 py-16 mx-auto max-w-7xl">
      <div className="text-center mb-12">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
          ♿ Accessibility & Internationalization
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Inclusive design and multi-language support for global accessibility
        </p>
      </div>

      {/* Language Selector */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">🌍 Language Support</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              disabled={!language.isSupported}
              className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                currentLanguage === language.code
                  ? 'border-blue-500 bg-blue-50 shadow-lg'
                  : language.isSupported
                  ? 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  : 'border-gray-200 bg-gray-100 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="text-2xl mb-2">{language.flag}</div>
              <div className="font-medium text-gray-800">{language.name}</div>
              <div className="text-sm text-gray-600">{language.nativeName}</div>
              {!language.isSupported && (
                <div className="text-xs text-gray-500 mt-1">Coming Soon</div>
              )}
            </button>
          ))}
        </div>
        
        {/* Language Preview */}
        <div className="mt-8 p-6 bg-gray-50 rounded-2xl">
          <h4 className="text-lg font-semibold text-gray-800 mb-4">Language Preview</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-600 mb-2">Welcome Message:</div>
              <div className="font-medium text-gray-800">
                {getCurrentContent('welcome_message')}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-2">Call to Action:</div>
              <div className="font-medium text-gray-800">
                {getCurrentContent('explore_library')}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Accessibility Features */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800">♿ Accessibility Features</h3>
          <button
            onClick={() => setShowAccessibilityPanel(!showAccessibilityPanel)}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
          >
            {showAccessibilityPanel ? 'Hide' : 'Show'} Quick Settings
          </button>
        </div>

        {/* Quick Settings Panel */}
        {showAccessibilityPanel && (
          <div className="mb-8 p-6 bg-blue-50 rounded-2xl">
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Quick Settings</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Font Size: {fontSize}px
                </label>
                <input
                  type="range"
                  min="12"
                  max="24"
                  value={fontSize}
                  onChange={(e) => setFontSize(parseInt(e.target.value))}
                  className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>12px</span>
                  <span>24px</span>
                </div>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={highContrast}
                    onChange={(e) => setHighContrast(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">High Contrast</span>
                </label>
              </div>
              
              <div>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={reducedMotion}
                    onChange={(e) => setReducedMotion(e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium text-gray-700">Reduced Motion</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accessibilityFeatures.map((feature) => (
            <div key={feature.id} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-6 border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="flex items-start justify-between mb-4">
                <div className="text-3xl">{feature.icon}</div>
                <button
                  onClick={() => toggleAccessibilityFeature(feature.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors duration-200 ${
                    feature.isEnabled
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {feature.isEnabled ? 'Enabled' : 'Disabled'}
                </button>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{feature.name}</h4>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              
              <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getCategoryColor(feature.category)}`}>
                {feature.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Accessibility Guidelines */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 mb-12">
        <h3 className="text-2xl font-bold text-gray-800 mb-6">📋 Accessibility Guidelines</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">WCAG 2.1 AA Compliance</h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Sufficient color contrast (4.5:1 minimum)
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Keyboard navigation support
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Screen reader compatibility
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Focus indicators
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Alternative text for images
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-4">Internationalization Standards</h4>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                UTF-8 encoding support
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Right-to-left (RTL) support
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Localized date formats
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Currency localization
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                Pluralization rules
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Testing Tools */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🔍</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Accessibility Testing</h4>
          <p className="text-gray-600 mb-4">Test your content with our accessibility tools</p>
          <button className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors duration-200">
            Run Tests
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">🌐</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Translation Tools</h4>
          <p className="text-gray-600 mb-4">Translate content to new languages</p>
          <button className="px-6 py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors duration-200">
            Translate
          </button>
        </div>
        
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl text-white">📊</span>
          </div>
          <h4 className="text-lg font-semibold text-gray-800 mb-2">Compliance Report</h4>
          <p className="text-gray-600 mb-4">Generate accessibility compliance reports</p>
          <button className="px-6 py-3 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors duration-200">
            Generate Report
          </button>
        </div>
      </div>

      {/* CSS for accessibility features */}
      <style jsx global>{`
        .high-contrast {
          --bg-primary: #000000;
          --text-primary: #ffffff;
          --border-primary: #ffffff;
        }
        
        .reduced-motion * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
        
        .high-contrast .bg-white {
          background-color: #000000 !important;
          color: #ffffff !important;
          border-color: #ffffff !important;
        }
      `}</style>
    </section>
  );
}
