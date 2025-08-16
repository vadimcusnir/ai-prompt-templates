'use client';

import { ChakraProvider, extendTheme } from '@chakra-ui/react';

// Tema AI-PROMPTS (cognitive blue + purple)
const aiPromptsTheme = extendTheme({
  colors: {
    brand: {
      50: '#f7fafc',
      100: '#e2e8f0',
      200: '#cbd5e0',
      300: '#a0aec0',
      400: '#718096',
      500: '#4a5568',
      600: '#2d3748',
      700: '#1a202c',
      800: '#171923',
      900: '#1a1a1a',
    },
    purple: {
      50: '#faf5ff',
      100: '#e9d8fd',
      200: '#d6bcfa',
      300: '#b794f6',
      400: '#9f7aea',
      500: '#805ad5',
      600: '#6b46c1',
      700: '#553c9a',
      800: '#44337a',
      900: '#322659',
    },
  },
  fonts: {
    heading: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    body: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'purple',
      },
    },
  },
});

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>AI Prompt Templates - Cognitive Architecture Platform</title>
        <meta name="description" content="Advanced prompt templates for cognitive architects. Deep analysis, meaning engineering, anti-pattern protection." />
      </head>
      <body>
        <ChakraProvider theme={aiPromptsTheme}>
          {children}
        </ChakraProvider>
      </body>
    </html>
  );
}