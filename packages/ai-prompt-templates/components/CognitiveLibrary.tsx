'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import ProtectedRoute from '@/components/ProtectedRoute'
import { SidebarNavigation } from './SidebarNavigation'
import { ContentArea } from './ContentArea'
import { TableOfContents } from './TableOfContents'
import { SearchFilters } from './SearchFilters'

export function CognitiveLibrary() {
  const { userTier } = useAuth()
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', padding: '2rem' }}>
      {/* Search & Filters Bar */}
      <SearchFilters 
        onSearch={setSearchQuery}
        onCategoryFilter={setSelectedCategory}
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
      />
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr 250px', 
        gap: '1.5rem',
        maxWidth: '1400px',
        margin: '0 auto'
      }}>
        {/* Sidebar Navigation */}
        <div>
          <SidebarNavigation
            selectedCategory={selectedCategory}
            onPromptSelect={setSelectedPrompt}
            searchQuery={searchQuery}
            userTier={userTier}
            loading={loading}
            setLoading={setLoading}
          />
        </div>

        {/* Main Content Area */}
        <div>
          <ContentArea
            promptId={selectedPrompt}
            userTier={userTier}
            loading={loading}
          />
        </div>

        {/* Table of Contents */}
        <div>
          <TableOfContents
            promptId={selectedPrompt}
          />
        </div>
      </div>
    </div>
  )
}
