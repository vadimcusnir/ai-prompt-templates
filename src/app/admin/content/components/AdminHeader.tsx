import React from 'react'

interface AdminHeaderProps {
  onAddNew: () => void
  onBackToDashboard: () => void
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onAddNew, onBackToDashboard }) => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      marginBottom: '2rem',
      padding: '1.5rem',
      backgroundColor: 'white',
      borderRadius: '1rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
    }}>
      <div>
        <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#374151', marginBottom: '0.5rem' }}>
          🛠️ Content Management
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
          Manage cognitive frameworks and content
        </p>
      </div>
      
      <div style={{ display: 'flex', gap: '1rem' }}>
        <button
          onClick={onAddNew}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#10b981',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          + Add New Prompt
        </button>
        
        <button
          onClick={onBackToDashboard}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '0.5rem',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  )
}

export default AdminHeader
