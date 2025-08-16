// 📄 FIȘIER: src/app/admin/content/page.tsx
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Grid,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast
} from '@chakra-ui/react';
import { createClient } from '@supabase/supabase-js';

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Framework {
  id: string;
  title: string;
  slug: string;
  cognitive_category: string;
  difficulty_tier: string;
  required_tier: string;
  cognitive_depth_score: number;
  pattern_complexity: number;
  base_price_cents: number;
  created_at: string;
}

export default function AdminContentPage() {
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const toast = useToast();

  // Load frameworks from database
  useEffect(() => {
    loadFrameworks();
  }, []);

  const loadFrameworks = async () => {
    try {
      const { data, error } = await supabase
        .from('cognitive_frameworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFrameworks(data || []);
    } catch (error: any) {
      toast({
        title: 'Error loading frameworks',
        description: error.message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
        toast({
          title: 'Success!',
          description: '25 new frameworks generated',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
        loadFrameworks(); // Reload list
      } else {
        throw new Error('Generation failed');
      }
    } catch (error) {
      toast({
        title: 'Generation Error',
        description: 'Could not generate new frameworks',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      <VStack spacing={8} align="stretch">
        
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
        <HStack spacing={6}>
          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px" borderColor="#e2e8f0">
            <Text fontSize="2xl" fontWeight="bold" color="#1f2937">
              {frameworks.length}
            </Text>
            <Text fontSize="sm" color="#64748b">Total Frameworks</Text>
          </Box>
          
          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px" borderColor="#e2e8f0">
            <Text fontSize="2xl" fontWeight="bold" color="#059669">
              €{Math.round(frameworks.reduce((sum, f) => sum + f.base_price_cents, 0) / 100).toLocaleString()}
            </Text>
            <Text fontSize="sm" color="#64748b">Total Value</Text>
          </Box>

          <Box bg="white" p={4} borderRadius="lg" borderWidth="1px" borderColor="#e2e8f0">
            <Text fontSize="2xl" fontWeight="bold" color="#dc2626">
              {frameworks.filter(f => f.difficulty_tier === 'expert').length}
            </Text>
            <Text fontSize="sm" color="#64748b">Expert Level</Text>
          </Box>
        </HStack>

        {/* Actions */}
        <HStack spacing={4}>
          <Button
            onClick={generateMoreFrameworks}
            bg="#6366f1"
            color="white"
            size="lg"
            isLoading={deploying}
            loadingText="Generating..."
            _hover={{ bg: "#4f46e5" }}
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
        </HStack>

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
                <VStack align="start" spacing={3}>
                  <Heading size="sm" color="#374151" noOfLines={2}>
                    {framework.title}
                  </Heading>
                  
                  <HStack spacing={2} flexWrap="wrap">
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
                      €{Math.round(framework.base_price_cents / 100)}
                    </Badge>
                  </HStack>
                  
                  <Text fontSize="xs" color="#64748b">
                    Depth: {framework.cognitive_depth_score}/10 | 
                    Complexity: {framework.pattern_complexity}/5
                  </Text>
                  
                  <Text fontSize="xs" color="#9ca3af">
                    Created: {new Date(framework.created_at).toLocaleDateString()}
                  </Text>
                </VStack>
              </Box>
            ))}
          </Grid>
        ) : (
          <Alert status="info">
            <AlertIcon />
            No frameworks found. Click "Generate" to create some.
          </Alert>
        )}
      </VStack>
    </Box>
  );
}