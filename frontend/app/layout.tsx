import { Inter, Outfit } from 'next/font/google';
import localFont from 'next/font/local';
import { headers } from 'next/headers';
import Link from 'next/link';
import { LayoutDashboard, MessageCircle } from 'lucide-react';
import { ThemeProvider } from '@/components/app/theme-provider';
import { ThemeToggle } from '@/components/app/theme-toggle';
import { cn } from '@/lib/shadcn/utils';
import { getAppConfig, getStyles } from '@/lib/utils';
import '@/styles/globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const outfit = Outfit({
  variable: '--font-outfit',
  subsets: ['latin'],
});

const commitMono = localFont({
  display: 'swap',
  variable: '--font-commit-mono',
  src: [
    {
      path: '../fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-700-Regular.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../fonts/CommitMono-400-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: '../fonts/CommitMono-700-Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default async function RootLayout({ children }: RootLayoutProps) {
  const hdrs = await headers();
  const appConfig = await getAppConfig(hdrs);
  const styles = getStyles(appConfig);
  const { pageTitle, pageDescription, companyName, logo, logoDark } = appConfig;

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        inter.variable,
        outfit.variable,
        commitMono.variable,
        'scroll-smooth font-sans antialiased'
      )}
    >
      <head>
        {styles && <style>{styles}</style>}
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
      </head>
      <body className="bg-mesh min-h-screen overflow-x-hidden">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <header className="fixed top-0 left-0 z-50 flex w-full flex-row items-center justify-between border-b border-white/20 bg-white/40 p-4 px-6 shadow-sm backdrop-blur-xl transition-all dark:border-slate-800/50 dark:bg-slate-950/40">
            <Link href="/" className="group flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-md shadow-indigo-600/20 transition-transform group-hover:scale-105">
                <span className="font-serif text-xl font-bold text-white">S</span>
              </div>
              <span className="font-sans text-lg font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Shiksha AI
              </span>
            </Link>

            <nav className="flex items-center gap-1 rounded-full border border-slate-200/50 bg-white/50 p-1.5 shadow-sm backdrop-blur-md dark:border-slate-700/50 dark:bg-slate-800/50">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
              >
                <MessageCircle className="size-4" />
                <span className="hidden sm:inline">Agent</span>
              </Link>
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-bold text-slate-600 transition-all hover:bg-white hover:text-indigo-600 hover:shadow-sm dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-indigo-400"
              >
                <LayoutDashboard className="size-4" />
                <span className="hidden sm:inline">Analytics</span>
              </Link>
            </nav>

            <div className="flex items-center">
              <ThemeToggle className="scale-90" />
            </div>
          </header>

          <div className="pt-20">{children}</div>
        </ThemeProvider>
      </body>
    </html>
  );
}
