import React from 'react';
import { BarChart3, TrendingUp, SlidersHorizontal } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { motion } from 'framer-motion';

export default function ChartSection({ volumeData, priorityData, stats }) {
  const PIE_COLORS = ['#dc3545', '#fd7e14', '#198754']; // Critique (HIGH), Moyenne (MEDIUM), Normale (LOW)

  const isDark = document.body.classList.contains('dark-mode');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Bar Chart - Volume */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="n1-card bg-white dark:bg-slate-900 p-6 flex flex-col gap-4 shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Volume Global des Tickets N1
            </h4>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-100 dark:border-emerald-900">
            Temps réel
          </span>
        </div>

        <div style={{ height: 240 }} className="w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={volumeData} barSize={36}>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={isDark ? '#1e293b' : '#f1f5f9'}
              />
              <XAxis
                dataKey="name"
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#94a3b8'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: isDark ? '#0f172a' : '#1e293b',
                  borderRadius: '12px',
                  border: isDark ? '1px solid #334155' : 'none',
                  color: '#fff',
                  fontSize: '12px',
                }}
                cursor={{ fill: isDark ? 'rgba(30, 41, 59, 0.4)' : 'rgba(241,245,249,0.6)' }}
              />
              <Bar dataKey="tickets" radius={[6, 6, 0, 0]}>
                {volumeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Pie Chart - Priorities */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="n1-card bg-white dark:bg-slate-900 p-6 flex flex-col gap-4 shadow-sm"
      >
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-600 dark:text-emerald-500" />
            <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm">
              Répartition par Criticité
            </h4>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 rounded border border-emerald-100 dark:border-emerald-900">
            Flux de Support
          </span>
        </div>

        {stats.available + stats.active === 0 ? (
          <div className="flex flex-col items-center justify-center h-[240px] text-center bg-slate-50/50 dark:bg-slate-900/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-800 p-4">
            <SlidersHorizontal className="h-10 w-10 text-slate-350 dark:text-slate-700 mb-2 animate-bounce-slow" />
            <p className="text-xs text-slate-450 dark:text-slate-555">
              Aucune intervention active à cartographier.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-4 h-[240px] mt-2">
            <div className="w-2/3 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="tickets"
                  >
                    {priorityData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: isDark ? '#0f172a' : '#1e293b',
                      borderRadius: '10px',
                      border: 'none',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-2.5 w-1/3 pr-2">
              {priorityData.map((item, index) => (
                <div
                  key={item.name}
                  className="flex items-center gap-2 text-xs font-semibold text-slate-605 dark:text-slate-300"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: PIE_COLORS[index] }}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium text-slate-400 text-[10px] uppercase leading-none">
                      {item.name}
                    </span>
                    <span className="text-sm font-bold text-slate-705 dark:text-slate-100">
                      {item.tickets} {item.tickets > 1 ? 'tickets' : 'ticket'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
