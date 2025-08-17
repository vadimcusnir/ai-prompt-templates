// 📄 FIȘIER: src/app/admin/content/page.tsx
'use client';

import { useState, useEffect } from 'react';
import React from 'react';

// Simple component replacements for Chakra UI
const Box = ({ children, ...props }: any) => <div {...props}>{children}</div>;
const Stack = ({ children, direction = 'column', gap = 4, ...props }: any) => (
  <div style={{ display: 'flex', flexDirection: direction, gap: `${gap * 0.25}rem`, ...props.style }} {...props}>{children}</div>
);
const Heading = ({ children, size = 'md', ...props }: any) => {
  const sizes = { lg: '1.75rem', md: '1.25rem', sm: '1rem' };
  return <h2 style={{ fontSize: sizes[size as keyof typeof sizes], fontWeight: 'bold', ...props.style }} {...props}>{children}</h2>;
};
const Text = ({ children, ...props }: any) => <p {...props}>{children}</p>;
const Button = ({ children, loading = false, ...props }: any) => (
  <button disabled={loading} {...props}>{loading ? 'Loading...' : children}</button>
);
const Grid = ({ children, ...props }: any) => <div style={{ display: 'grid', ...props.style }} {...props}>{children}</div>;
const Badge = ({ children, ...props }: any) => (
  <span style={{ padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', backgroundColor: '#e5e7eb', ...props.style }} {...props}>{children}</span>
);
const Spinner = ({ size, ...props }: any) => <div {...props}>Loading...</div>;
import { createClientSideClient } from '@/lib/supabase';

// Supabase client
const supabase = createClientSideClient();

interface Framework {
  id: string;
  title: string;
  slug: string;
  cognitive_category: string;
  difficulty_tier: string;
  required_tier: string;
  cognitive_depth_score: number;
  pattern_complexity: number;
  price_cents: number;
  created_at: string;
  view_count: number;
  download_count: number;
}

export default function AdminContentPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);


  // Load frameworks from database
  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      const { data, error } = await supabase
        .from('prompts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFrameworks(data || []);
    } catch (error: any) {
      console.error('Error loading frameworks:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const generateMoreFrameworks = async () => {
    setDeploying(true);
    
    try {
      // Generate additional frameworks via our generation script
      const response = await fetch('/api/generate-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ count: 25 })
      });

      if (response.ok) {
        console.log('Success! 25 new frameworks generated');
        loadFrameworks(); // Reload list
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      console.error('Generation Error: Could not generate new frameworks');
    } finally {
      setDeploying(false);
    }
  };

  if (loading) {
    return (
      <Box p={8} display="flex" justifyContent="center">
        <Spinner size="xl" />
      </Box>
    );
  }

  return (
    <Box p={8} maxW="7xl" mx="auto">
      <Stack gap={8}>
        
        {/* Header */}
        <Box>
          <Heading size="lg" color="#1f2937" mb={2}>
            AI-Prompt-Templates Content Manager
          </Heading>
          <Text color="#64748b">
            Manage and deploy cognitive frameworks for ecommerce optimization
          </Text>
        </Box>

        {/* Stats */}
        <Stack direction="row" gap={6}>
          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px" borderColor="#e2e8f0">
            <Text fontSize="2xl" fontWeight="bold" color="#1f2937">
              {frameworks.length}
            </Text>
            <Text fontSize="sm" color="#64748b">Total Frameworks</Text>
          </Box>
          
          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px" borderColor="#e2e8f0">
            <Text fontSize="2xl" fontWeight="bold" color="#059669">
              €{Math.round(frameworks.reduce((sum, f) => sum + f.price_cents, 0) / 100).toLocaleString()}
            </Text>
            <Text fontSize="sm" color="#64748b">Total Value</Text>
          </Box>

          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px" borderColor="#e2e8f0">
            <Text fontSize="2xl" fontWeight="bold" color="#dc2626">
              {frameworks.filter(f => f.difficulty_tier === 'expert').length}
            </Text>
            <Text fontSize="sm" color="#64748b">Expert Level</Text>
          </Box>
        </Stack>

        {/* Actions */}
        <Stack direction="row" gap={4}>
          <Button
            onClick={generateMoreFrameworks}
            bg="#6366f1"
            color="white"
            size="lg"
            loading={deploying}
            loadingText="Generating..."
            _hover={{ backgroundColor: "#4f46e5" }}
          >
            Generate 25 More Frameworks
          </Button>
          
          <Button
            onClick={loadFrameworks}
            variant="outline"
            colorScheme="gray"
            size="lg"
          >
            Refresh List
          </Button>
        </Stack>

        {/* Framework Grid */}
        {frameworks.length > 0 ? (
          <Grid templateColumns="repeat(auto-fit, minmax(350px, 1fr))" gap={6}>
            {frameworks.map((framework) => (
              <Box 
                key={framework.id} 
                p={6} 
                bg="white" 
                borderRadius="lg" 
                borderWidth="1px" 
                borderColor="#e2e8f0"
                _hover={{ shadow: "md", borderColor: "#6366f1" }}
                transition="all 0.2s"
              >
                <Stack gap={3}>
                  <Heading size="sm" color="#374151" textOverflow="ellipsis" overflow="hidden" whiteSpace="nowrap">
                    {framework.title}
                  </Heading>
                  
                  <Stack direction="row" gap={2} flexWrap="wrap">
                    <Badge 
                      bg={framework.difficulty_tier === 'expert' ? "#dc2626" : 
                          framework.difficulty_tier === 'advanced' ? "#ea580c" : "#059669"} 
                      color="white"
                    >
                      {framework.difficulty_tier}
                    </Badge>
                    <Badge variant="outline" colorScheme="blue">
                      {framework.cognitive_category}
                    </Badge>
                    <Badge variant="outline" colorScheme="purple">
                      €{Math.round(framework.price_cents / 100)}
                    </Badge>
                  </Stack>
                  
                  <Text fontSize="xs" color="#64748b">
                    Depth: {framework.cognitive_depth_score}/10 | 
                    Complexity: {framework.pattern_complexity}/5
                  </Text>
                  
                  <Text fontSize="xs" color="#9ca3af">
                    Created: {new Date(framework.created_at).toLocaleDateString()}
                  </Text>
                </Stack>
              </Box>
            ))}
          </Grid>
        ) : (
          <Box p={4} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
            <Text color="blue.700">No frameworks found. Click "Generate" to create some.</Text>
          </Box>
        )}
      </Stack>
    </Box>
  );
}