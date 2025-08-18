'use client';

export default function HomePage() {
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
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '2rem',
        width: '100%',
        maxWidth: '1000px'
      }}>
        <div style={{
          padding: '2rem',
          border: '1px solid #e5e7eb',
          borderRadius: '1rem',
          textAlign: 'center',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🧠</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
            Deep Analysis
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
            Latent pattern extraction and non-linear dependencies
          </p>
          <span style={{
            backgroundColor: '#8b5cf6',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            45 Frameworks
          </span>
        </div>
        
        <div style={{
          padding: '2rem',
          border: '1px solid #e5e7eb',
          borderRadius: '1rem',
          textAlign: 'center',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚡</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
            Meaning Engineering
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
            Strategic communication and sense-making frameworks
          </p>
          <span style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            38 Frameworks
          </span>
        </div>
        
        <div style={{
          padding: '2rem',
          border: '1px solid #e5e7eb',
          borderRadius: '1rem',
          textAlign: 'center',
          backgroundColor: 'white',
          boxShadow: '0 4px 6px rgba(0,0,0,0.05)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎯</div>
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem', color: '#374151', fontWeight: '600' }}>
            Cognitive Frameworks
          </h3>
          <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem', lineHeight: '1.5' }}>
            Meta-learning systems and auto-distillation processes
          </p>
          <span style={{
            backgroundColor: '#10b981',
            color: 'white',
            padding: '0.25rem 0.75rem',
            borderRadius: '1rem',
            fontSize: '0.75rem',
            fontWeight: '500'
          }}>
            52 Frameworks
          </span>
        </div>
      </div>
      
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
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#3b82f6' }}>185+</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Cognitive Frameworks</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#8b5cf6' }}>8.5/10</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Quality Score</div>
          </div>
          <div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#10b981' }}>€29-299</div>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>Digital Root 2</div>
          </div>
        </div>
      </div>
    </div>
  );
}