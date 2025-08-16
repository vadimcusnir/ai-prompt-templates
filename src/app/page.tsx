'use client';

import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  Grid,
  GridItem,
  Badge,
  Icon,
  Flex,
  SimpleGrid,
} from '@chakra-ui/react';
import { FaBrain, FaCode, FaRocket, FaShield } from 'react-icons/fa';

export default function HomePage() {
  return (
    <Box>
      {/* Hero Section */}
      <Container maxW="7xl" py={20}>
        <VStack spacing={8} textAlign="center">
          <Badge colorScheme="purple" fontSize="md" px={4} py={2}>
            Cognitive Architecture Platform
          </Badge>
          
          <Heading
            as="h1"
            size="3xl"
            bgGradient="linear(to-r, purple.400, blue.400)"
            bgClip="text"
            lineHeight="1.2"
          >
            AI Prompt Templates
          </Heading>
          
          <Text fontSize="xl" color="gray.600" maxW="2xl">
            Construiește arhitecturi cognitive avansate. Depășește prompturile comune. 
            Accesează meaning engineering pentru rezultate transformatoare.
          </Text>
          
          <HStack spacing={4}>
            <Button
              size="lg"
              colorScheme="purple"
              rightIcon={<FaRocket />}
            >
              Începe Explorarea
            </Button>
            <Button
              size="lg"
              variant="outline"
              colorScheme="blue"
            >
              Vezi Framework-uri
            </Button>
          </HStack>
        </VStack>
      </Container>

      {/* Features Section */}
      <Box bg="gray.50" py={20}>
        <Container maxW="7xl">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center">
              <Heading size="xl">Pentru Cognitive Architects</Heading>
              <Text fontSize="lg" color="gray.600" maxW="2xl">
                Platformă construită pentru cei care refuză superficialitatea și 
                caută depth în prompt engineering.
              </Text>
            </VStack>

            <SimpleGrid columns={[1, 2, 4]} spacing={8}>
              <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="sm">
                <Icon as={FaBrain} w={8} h={8} color="purple.500" />
                <Heading size="md">Deep Analysis</Heading>
                <Text textAlign="center" fontSize="sm" color="gray.600">
                  Framework-uri pentru analiza în straturi multiple și 
                  detectarea pattern-urilor ascunse.
                </Text>
              </VStack>

              <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="sm">
                <Icon as={FaCode} w={8} h={8} color="blue.500" />
                <Heading size="md">Meaning Engineering</Heading>
                <Text textAlign="center" fontSize="sm" color="gray.600">
                  Construcție sistematică de sens prin prompt-uri cu 
                  arhitectură semantică precisă.
                </Text>
              </VStack>

              <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="sm">
                <Icon as={FaShield} w={8} h={8} color="purple.500" />
                <Heading size="md">Anti-Pattern Shield</Heading>
                <Text textAlign="center" fontSize="sm" color="gray.600">
                  Protecție împotriva prompt-urilor generice și 
                  rezultatelor superficiale.
                </Text>
              </VStack>

              <VStack spacing={4} p={6} bg="white" borderRadius="lg" shadow="sm">
                <Icon as={FaRocket} w={8} h={8} color="blue.500" />
                <Heading size="md">Progressive Gating</Heading>
                <Text textAlign="center" fontSize="sm" color="gray.600">
                  Acces gradual la complexitate crescândă pe măsură 
                  ce îți dezvolți competența.
                </Text>
              </VStack>
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Categories Preview */}
      <Container maxW="7xl" py={20}>
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center">
            <Heading size="xl">Categorii Cognitive</Heading>
            <Text fontSize="lg" color="gray.600">
              Explore structured approaches to AI interaction
            </Text>
          </VStack>

          <Grid templateColumns={['1fr', '1fr', 'repeat(2, 1fr)']} gap={8}>
            <GridItem>
              <Box p={8} borderWidth={1} borderRadius="xl" borderColor="purple.200">
                <VStack spacing={4} align="start">
                  <Badge colorScheme="purple">Deep Analysis</Badge>
                  <Heading size="lg">Cognitive Frameworks</Heading>
                  <Text color="gray.600">
                    Template-uri pentru analiza multi-dimensională, pattern recognition și 
                    construcția de insight-uri non-evidente.
                  </Text>
                  <Button colorScheme="purple" variant="outline" size="sm">
                    29€ - 199€
                  </Button>
                </VStack>
              </Box>
            </GridItem>

            <GridItem>
              <Box p={8} borderWidth={1} borderRadius="xl" borderColor="blue.200">
                <VStack spacing={4} align="start">
                  <Badge colorScheme="blue">Advanced Systems</Badge>
                  <Heading size="lg">Consciousness Mapping</Heading>
                  <Text color="gray.600">
                    Arhitecturi pentru explorarea perspectivelor complexe și 
                    maparea territory-urilor conceptuale neobișnuite.
                  </Text>
                  <Button colorScheme="blue" variant="outline" size="sm">
                    59€ - 299€
                  </Button>
                </VStack>
              </Box>
            </GridItem>
          </Grid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="purple.50" py={20}>
        <Container maxW="4xl">
          <VStack spacing={8} textAlign="center">
            <Heading size="xl">Început cu Access Tier</Heading>
            <Text fontSize="lg" color="gray.600">
              Alege nivelul de complexitate potrivit pentru arhitectura ta cognitivă actuală.
            </Text>
            
            <HStack spacing={4} flexWrap="wrap" justify="center">
              <Button colorScheme="gray" variant="outline">
                Explorer - €49/lună
              </Button>
              <Button colorScheme="purple">
                Architect - €89/lună
              </Button>
              <Button colorScheme="blue" variant="outline">
                Master - €189/lună
              </Button>
            </HStack>
            
            <Text fontSize="sm" color="gray.500">
              Începe cu 7 zile trial. Anulează oricând.
            </Text>
          </VStack>
        </Container>
      </Box>
    </Box>
  );
}