import './global.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Performa AI — One API. Every Model. Pay Only What You Use.',
  description:
    'Unified AI API platform with pay-per-request billing. Access Llama, Qwen, Mistral and more through a single endpoint.',
  openGraph: {
    title: 'Performa AI — Unified AI API Platform',
    description:
      'Access top-tier LLMs through one endpoint. No subscriptions. Pay only what you use.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-gray-950 text-white antialiased">{children}</body>
    </html>
  );
}
