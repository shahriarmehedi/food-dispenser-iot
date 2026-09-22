import type { Metadata } from 'next';
import { Figtree } from 'next/font/google';
import './globals.css';

const figtree = Figtree({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-figtree',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Smart Food Dispenser - IoT Terminal & Admin Console',
  description: 'Smart weight-based food dispenser IoT controller and administrative portal',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${figtree.variable} h-full bg-[#090c13]`}>
      <body className="h-full bg-[#090c13] text-slate-100 font-sans antialiased selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
