import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI-PROMPT-TEMPLATES',
  description: 'Cognitive Architecture Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-gray-50">
        {children}
      </body>
    </html>
  );
}