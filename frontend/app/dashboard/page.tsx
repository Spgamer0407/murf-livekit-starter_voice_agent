import React from 'react';
import sqlite3 from 'sqlite3';
import path from 'path';
import Link from 'next/link';
import { ArrowLeft, Phone, CheckCircle2, AlertCircle, BarChart3, PieChart, Users } from 'lucide-react';
import { unstable_noStore as noStore } from 'next/cache';
import { AutoRefresh, ManualRefreshButton } from './auto-refresh';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function getCallStats() {
  const dbPath = path.resolve(process.cwd(), '../backend/shiksha.db');
  
  return new Promise<{ total: number; successful: number; failed: number }>((resolve) => {
    const db = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
      if (err) {
        console.error('Error opening database', err);
        return resolve({ total: 0, successful: 0, failed: 0 });
      }
    });

    db.all('SELECT status, COUNT(*) as count FROM calls GROUP BY status', (err, rows) => {
      if (err) {
        resolve({ total: 0, successful: 0, failed: 0 });
      } else {
        let successful = 0;
        let failed = 0;
        rows.forEach((row: any) => {
          if (row.status === 'successful') successful = row.count;
          if (row.status === 'failed') failed = row.count;
        });
        resolve({
          total: successful + failed,
          successful,
          failed
        });
      }
      db.close();
    });
  });
}

export default async function DashboardPage() {
  noStore(); // Completely disables all Next.js caching for this page
  const stats = await getCallStats();

  // Calculate percentages safely
  const successRate = stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0;
  const failRate = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;

  return (
    <>
      {/* Silently refreshes the server component every 1 second (1000ms) for instant updates */}
      <AutoRefresh intervalMs={1000} />
      
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      
      {/* Top Navigation Bar */}
      <nav className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <a href="/" className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500">
            <ArrowLeft className="w-5 h-5" />
          </a>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-inner">
              <BarChart3 className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 dark:text-slate-100">Analytics Dashboard</h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <ManualRefreshButton />
          
          <div className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-bold uppercase tracking-wider flex items-center gap-2 border border-green-200 dark:border-green-800/50">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Live Data
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-6 md:p-8 lg:p-12">
        
        <div className="mb-10">
          <h2 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">Overview</h2>
          <p className="text-slate-500 dark:text-slate-400">Track user engagement and session outcomes across all your calls.</p>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* Main Total Metric - Large Span */}
          <div className="md:col-span-4 row-span-2 bg-indigo-600 dark:bg-indigo-700 rounded-3xl p-8 text-white shadow-xl shadow-indigo-200/50 dark:shadow-none flex flex-col justify-between relative overflow-hidden group">
            {/* Decorative background circle */}
            <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500 dark:bg-indigo-600 rounded-full blur-2xl opacity-50 group-hover:scale-110 transition-transform duration-700"></div>
            
            <div className="relative z-10">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-indigo-100 font-semibold text-lg mb-1">Total Call Volume</h3>
              <p className="text-7xl font-black tracking-tighter drop-shadow-sm">{stats.total}</p>
            </div>
            
            <div className="relative z-10 mt-8 pt-6 border-t border-indigo-400/30">
              <p className="text-indigo-100 text-sm">
                Total number of connections established.
              </p>
            </div>
          </div>

          {/* Successful Calls Metric */}
          <div className="md:col-span-4 bg-emerald-500 dark:bg-emerald-600 rounded-3xl p-8 text-white shadow-xl shadow-emerald-200/50 dark:shadow-none flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-400 dark:bg-emerald-500 rounded-full opacity-50 group-hover:scale-125 transition-transform duration-500"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className="text-emerald-50 font-semibold text-lg mb-1">Successful</h3>
                <p className="text-5xl font-black tracking-tighter drop-shadow-sm">{stats.successful}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="relative z-10 mt-4 flex items-center gap-2">
              <span className="bg-white text-emerald-600 text-xs font-black px-2 py-1 rounded-md">
                {successRate}%
              </span>
              <span className="text-emerald-100 text-sm font-medium">Completion Rate</span>
            </div>
          </div>

          {/* Failed Calls Metric */}
          <div className="md:col-span-4 bg-rose-500 dark:bg-rose-600 rounded-3xl p-8 text-white shadow-xl shadow-rose-200/50 dark:shadow-none flex flex-col justify-between relative overflow-hidden group">
            <div className="absolute -left-6 -top-6 w-32 h-32 bg-rose-400 dark:bg-rose-500 rotate-45 opacity-50 group-hover:rotate-90 transition-transform duration-700"></div>
            
            <div className="relative z-10 flex justify-between items-start">
              <div>
                <h3 className="text-rose-50 font-semibold text-lg mb-1">Incomplete</h3>
                <p className="text-5xl font-black tracking-tighter drop-shadow-sm">{stats.failed}</p>
              </div>
              <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
            
            <div className="relative z-10 mt-4 flex items-center gap-2">
              <span className="bg-white text-rose-600 text-xs font-black px-2 py-1 rounded-md">
                {failRate}%
              </span>
              <span className="text-rose-100 text-sm font-medium">Drop-off Rate</span>
            </div>
          </div>

          {/* Breakdown Chart / Visual Placeholder */}
          <div className="md:col-span-8 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-xl">Outcome Distribution</h3>
              <div className="w-10 h-10 bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400 rounded-xl flex items-center justify-center">
                <PieChart className="w-5 h-5" />
              </div>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              {/* Colorful Progress Bar representing distribution */}
              <div className="h-6 w-full rounded-full bg-slate-100 dark:bg-slate-800 flex overflow-hidden mb-4">
                <div style={{ width: `${successRate}%` }} className="bg-emerald-500 h-full transition-all duration-1000 ease-out"></div>
                <div style={{ width: `${failRate}%` }} className="bg-rose-500 h-full transition-all duration-1000 ease-out"></div>
              </div>
              
              <div className="flex items-center justify-between text-sm font-medium">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-slate-600 dark:text-slate-300">Exercises Completed ({stats.successful})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                  <span className="text-slate-600 dark:text-slate-300">Did not finish ({stats.failed})</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Privacy Notice inside a creative solid block */}
        <div className="mt-8 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/30 rounded-2xl p-6 flex items-start gap-4 shadow-sm">
          <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-xl shrink-0">
            <Phone className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h4 className="font-bold text-amber-900 dark:text-amber-200 text-lg">Privacy First Analytics</h4>
            <p className="text-amber-700 dark:text-amber-400/80 mt-1 leading-relaxed">
              This dashboard provides operational insights strictly through aggregated data. Personal Identifiable Information (PII), conversational transcripts, and user accounts are entirely excluded from this view to ensure strict data privacy compliance.
            </p>
          </div>
        </div>

      </main>
    </div>
    </>
  );
}
