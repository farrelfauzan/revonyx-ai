import './global.css';
import { Providers } from "@/components/providers";

export const metadata = {
  title: "Revonix AI Chat",
  description: "AI Chat Portal powered by Revonix AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
