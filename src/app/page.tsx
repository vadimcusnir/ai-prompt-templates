'use client';

import { useState, useEffect } from 'react';

interface Prompt {
  id: string;
  title: string;
  cognitive_category: string;
  difficulty_tier: string;
  formatted_price: string;
  cognitive_depth_score: number;
  pattern_complexity: number;
}

export default function HomePage() {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchPrompts();
  }, []);
  
  const fetchPrompts = async () => {
    try {
      const response = await fetch('/api/prompts?tier=explorer');
      const data = await response.json();
      setPrompts(data.prompts || []);
    } catch (error) {
      console.error('Failed to fetch prompts:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: 'system-ui, sans-serif',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '800px' }}>
        <h1 style={{ 
          fontSize: '3rem', 
          marginBottom: '1rem',
          background: 'linear-gradient(45deg, #3b82f6, #8b5cf6)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontWeight: 'bold'
        }}>
          🧠 AI-Prompt-Templates
        </h1>
        
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#6b7280', 
          marginBottom: '2rem' 
        }}>
          Cognitive Architecture Platform for Advanced AI Prompts
        </p>
        
        <p style={{ 
          fontSize: '1rem', 
          color: '#9ca3af', 
          marginBottom: '3rem',
          lineHeight: '1.6'
        }}>
          Beyond surface patterns into meaning engineering and cognitive depth. 
          Designed for strategic communicators and cognitive architects.
        </p>
        
        <div style={{ marginBottom: '3rem' }}>
          <button style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            border: 'none',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            marginRight: '1rem',
            transition: 'all 0.2s'
          }}>
            Explore Cognitive Library
          </button>
          
          <button style={{
            backgroundColor: 'transparent',
            color: '#3b82f6',
            padding: '1rem 2rem',
            fontSize: '1.1rem',
            border: '2px solid #3b82f6',
            borderRadius: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}>
            View Pricing
          </button>
        </div>
      </div>
      
      {/* Real Frameworks Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div style={{ fontSize: '1.5rem', color: '#6b7280' }}>Loading cognitive frameworks...</div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          width: '100%',
          maxWidth: '1200px'
        }}>
          {prompts.slice(0, 6).map((prompt) => (
            <div key={prompt.id} style={{
              padding: '2rem',
              border: '1px solid #e5e7eb',
              borderRadius: '1rem',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}>
              <div style={{ marginBottom: '1rem' }}>
                <h3 style={{ 
                  fontSize: '1.1rem', 
                  marginBottom: '0.5rem', 
                  color: '#374151', 
                  fontWeight: '600',
                  lineHeight: '1.4'
                }}>
                  {prompt.title}
                </h3>
                
                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  <span style={{
                    backgroundColor: prompt.difficulty_tier === 'expert' ? '#dc2626' : 
                                    prompt.difficulty_tier === 'advanced' ? '#ea580c' : '#059669',
                    color: 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {prompt.difficulty_tier}
                  </span>
                  
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    border: '1px solid #d1d5db'
                  }}>
                    {prompt.cognitive_category.replace('_', ' ')}
                  </span>
                  
                  <span style={{
                    backgroundColor: '#8b5cf6',
                    color: 'white',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {prompt.formatted_price}
                  </span>
                </div>
                
                <div style={{ fontSize: '0.8rem', color: '#6b7280' }}>
                  Depth: {prompt.cognitive_depth_score}/10 | Complexity: {prompt.pattern_complexity}/5
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div style={{ 
        marginTop: '4rem', 
        textAlign: 'center',
        padding: '2rem',
        backgroundColor: 'white',
        borderRadius: '1rem',
        boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
        maxWidth: '600px'
      }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#374151' }}>
          🚀 Platform Status
        </h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(3, 1fr)', 
          gap: '1rem', 
          textAlign: 'center' 
        }}>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>
              {prompts.length}+
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cognitive Frameworks</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>8.5/10</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Quality Score</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>
              €{prompts.length > 0 ? 
                Math.min(...prompts.map(p => parseInt(p.formatted_price.replace('€', '')))) + 
                '-' + 
                Math.max(...prompts.map(p => parseInt(p.formatted_price.replace('€', '')))) : 
                '29-299'
              }
            </div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Digital Root 2</div>
          </div>
        </div>
      </div>
    </div>
  );
}