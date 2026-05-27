import type { Metadata } from 'next';
import { JetBrains_Mono, Syne, Instrument_Serif } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';

const syne = Syne({
  variable: '--font-syne',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
});

const instrumentSerif = Instrument_Serif({
  variable: '--font-instrument-serif',
  subsets: ['latin'],
  weight: ['400'],
  style: ['italic'],
});

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-jetbrains-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Vox Academic - PDF to Speech Learning Platform',
  description:
    'Transform academic PDFs into engaging audio with AI-powered insights and interactive learning.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-linear-to-br from-navy-dark via-navy-darker to-charcoal text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
