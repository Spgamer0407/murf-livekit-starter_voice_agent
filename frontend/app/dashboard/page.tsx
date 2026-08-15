import React from 'react';
import { unstable_noStore as noStore } from 'next/cache';
import Link from 'next/link';
import { AlertCircle, BarChart3, CheckCircle2, Phone, PieChart, Users } from 'lucide-react';
import path from 'path';
import sqlite3 from 'sqlite3';
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
        interface CallRow {
          status: string;
          count: number;
        }
        rows.forEach((row: CallRow) => {
          if (row.status === 'successful') successful = row.count;
          if (row.status === 'failed') failed = row.count;
        });
        resolve({
          total: successful + failed,
          successful,
          failed,
        });
      }
      db.close();
    });
  });
}

export default async function DashboardPage() {
  noStore();
  const stats = await getCallStats();
  const successRate = stats.total > 0 ? Math.round((stats.successful / stats.total) * 100) : 0;
  const failRate = stats.total > 0 ? Math.round((stats.failed / stats.total) * 100) : 0;

  return (
    <>
      <AutoRefresh intervalMs={1000} />

      <div className="flex min-h-screen flex-col pt-8 font-sans text-slate-900 dark:text-slate-100">
        <main className="mx-auto w-full max-w-7xl p-6 md:p-8 lg:p-12">
          <div className="mb-12 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="mb-2 font-serif text-4xl font-extrabold text-slate-800 dark:text-slate-100">
                Shiksha Analytics
              </h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">
                Track engagement and conversational outcomes in real-time.
              </p>
            </div>

            <div className="flex items-center gap-3 rounded-full border border-stone-200/50 bg-white/50 px-4 py-2 shadow-sm backdrop-blur-md dark:border-slate-800/50 dark:bg-slate-900/50">
              <ManualRefreshButton />
              <div className="mx-1 h-6 w-[1px] bg-stone-300 dark:bg-stone-700"></div>
              <div className="flex items-center gap-2 text-xs font-bold tracking-wider text-emerald-600 uppercase dark:text-emerald-400">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                Live Connection
              </div>
            </div>
          </div>

          <div className="grid auto-rows-[minmax(180px,auto)] grid-cols-1 gap-6 md:grid-cols-12">
            <div className="group relative row-span-2 flex flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-indigo-500 to-violet-600 p-8 text-white shadow-xl shadow-indigo-500/20 md:col-span-4">
              <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl transition-transform duration-700 group-hover:scale-125"></div>
              <div className="relative z-10">
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-indigo-100">Total Call Volume</h3>
                <p className="text-7xl font-black tracking-tighter drop-shadow-sm">{stats.total}</p>
              </div>
              <div className="relative z-10 mt-8 border-t border-white/20 pt-6">
                <p className="text-sm font-medium text-indigo-100">
                  Total number of sessions established.
                </p>
              </div>
            </div>

            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-emerald-400 to-emerald-600 p-8 text-white shadow-xl shadow-emerald-500/20 md:col-span-4">
              <div className="absolute -right-6 -bottom-6 h-48 w-48 rounded-full bg-white opacity-10 blur-2xl transition-transform duration-500 group-hover:scale-125"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-emerald-50">Successful</h3>
                  <p className="text-6xl font-black tracking-tighter drop-shadow-sm">
                    {stats.successful}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                  <CheckCircle2 className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="relative z-10 mt-6 flex items-center gap-3">
                <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-black text-emerald-600 shadow-sm">
                  {successRate}%
                </span>
                <span className="text-sm font-bold tracking-wide text-emerald-50 uppercase">
                  Completion Rate
                </span>
              </div>
            </div>

            <div className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-gradient-to-br from-rose-400 to-rose-600 p-8 text-white shadow-xl shadow-rose-500/20 md:col-span-4">
              <div className="absolute -top-6 -left-6 h-48 w-48 rotate-45 bg-white opacity-10 blur-2xl transition-transform duration-700 group-hover:rotate-90"></div>
              <div className="relative z-10 flex items-start justify-between">
                <div>
                  <h3 className="mb-1 text-lg font-semibold text-rose-50">Incomplete</h3>
                  <p className="text-6xl font-black tracking-tighter drop-shadow-sm">
                    {stats.failed}
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 shadow-inner backdrop-blur-md">
                  <AlertCircle className="h-6 w-6 text-white" />
                </div>
              </div>
              <div className="relative z-10 mt-6 flex items-center gap-3">
                <span className="rounded-xl bg-white px-3 py-1.5 text-sm font-black text-rose-600 shadow-sm">
                  {failRate}%
                </span>
                <span className="text-sm font-bold tracking-wide text-rose-50 uppercase">
                  Drop-off Rate
                </span>
              </div>
            </div>

            <div className="glass-panel flex flex-col rounded-[2rem] p-8 md:col-span-8">
              <div className="mb-10 flex items-center justify-between">
                <h3 className="font-serif text-2xl font-bold text-slate-800 dark:text-slate-100">
                  Outcome Distribution
                </h3>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300">
                  <PieChart className="h-6 w-6" />
                </div>
              </div>
              <div className="flex flex-1 flex-col justify-center">
                <div className="mb-6 flex h-8 w-full overflow-hidden rounded-full bg-slate-200 shadow-inner dark:bg-slate-800">
                  <div
                    style={{ width: `${successRate}%` }}
                    className="h-full bg-emerald-500 transition-all duration-1000 ease-out"
                  ></div>
                  <div
                    style={{ width: `${failRate}%` }}
                    className="h-full bg-rose-500 transition-all duration-1000 ease-out"
                  ></div>
                </div>
                <div className="flex items-center justify-between text-base font-semibold">
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Exercises Completed ({stats.successful})
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-4 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50"></div>
                    <span className="text-slate-700 dark:text-slate-300">
                      Did not finish ({stats.failed})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-start gap-5 rounded-[2rem] border border-amber-200/60 bg-amber-50/80 p-8 shadow-sm backdrop-blur-sm dark:border-amber-800/40 dark:bg-amber-950/40">
            <div className="shrink-0 rounded-2xl bg-amber-200/50 p-4 shadow-inner dark:bg-amber-900/50">
              <Phone className="h-7 w-7 text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h4 className="mb-2 font-serif text-xl font-bold text-amber-900 dark:text-amber-200">
                Privacy First Analytics
              </h4>
              <p className="leading-relaxed font-medium text-amber-800/90 dark:text-amber-400/80">
                This dashboard provides operational insights strictly through aggregated data.
                Personal Identifiable Information (PII), conversational transcripts, and user
                accounts are entirely excluded from this view to ensure strict data privacy
                compliance.
              </p>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}
