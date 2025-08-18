import Head from 'next/head'

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string
  ogImage?: string
  ogUrl?: string
  canonicalUrl?: string
  structuredData?: object
}

export default function SEOHead({
  title = 'AI Prompt Templates - Cognitive Architecture Platform',
  description = 'Advanced AI prompts for cognitive depth and meaning engineering. Access professional cognitive frameworks designed for deep analysis and meaning engineering.',
  keywords = 'AI prompts, cognitive frameworks, meaning engineering, deep analysis, consciousness mapping, AI templates, cognitive architecture',
  ogImage = '/og-image.jpg',
  ogUrl,
  canonicalUrl,
  structuredData
}: SEOHeadProps) {
  const fullTitle = title === 'AI Prompt Templates - Cognitive Architecture Platform' 
    ? title 
    : `${title} | AI Prompt Templates`

  const fullDescription = description.length > 160 
    ? description.substring(0, 157) + '...' 
    : description

  const defaultStructuredData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "AI Prompt Templates",
    "description": "Advanced AI prompts for cognitive depth and meaning engineering",
    "url": "https://ai-prompt-templates.com",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://ai-prompt-templates.com/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  }

  const finalStructuredData = structuredData || defaultStructuredData

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content="AI Prompt Templates" />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="7 days" />
      
      {/* Canonical URL */}
      {canonicalUrl && <link rel="canonical" href={canonicalUrl} />}
      
      {/* Open Graph Meta Tags */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={ogUrl || 'https://ai-prompt-templates.com'} />
      <meta property="og:site_name" content="AI Prompt Templates" />
      <meta property="og:locale" content="en_US" />
      
      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:site" content="@aiprompttemplates" />
      
      {/* Additional Meta Tags */}
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#3b82f6" />
      <meta name="msapplication-TileColor" content="#3b82f6" />
      
      {/* Favicon */}
      <link rel="icon" href="/favicon.ico" />
      <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
      <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
      
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(finalStructuredData)
        }}
      />
      
      {/* Preconnect to external domains */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="preconnect" href="https://js.stripe.com" />
      
      {/* DNS Prefetch */}
      <link rel="dns-prefetch" href="//fonts.googleapis.com" />
      <link rel="dns-prefetch" href="//js.stripe.com" />
      
      {/* Security Headers */}
      <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
      <meta name="referrer" content="strict-origin-when-cross-origin" />
      
      {/* Performance Optimization */}
      <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
    </Head>
  )
}
