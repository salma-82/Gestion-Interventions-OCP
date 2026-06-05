import React from 'react';
import { Inbox, Wrench, CheckCircle, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DashboardCards({ stats, onCardClick }) {
  const cardData = [
    {
      key: 'PENDING',
      title: 'Tickets en attente',
      value: stats.available,
      trend: 'Nouveaux incidents',
      icon: <Inbox className="h-6 w-6 text-blue-600 dark:text-blue-400" />,
      borderColor: 'border-t-blue-500',
      iconBg: 'bg-blue-50 dark:bg-blue-950/30',
    },
    {
      key: 'EN_COURS',
      title: 'Tickets en cours N1',
      value: stats.active,
      trend: 'Interventions actives',
      icon: <Wrench className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />,
      borderColor: 'border-t-emerald-500',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/30',
    },
    {
      key: 'CLOSED',
      title: 'Tickets résolus par N1',
      value: stats.closed,
      trend: 'Incidents résolus',
      icon: <CheckCircle className="h-6 w-6 text-slate-650 dark:text-slate-400" />,
      borderColor: 'border-t-slate-500',
      iconBg: 'bg-slate-50 dark:bg-slate-800/30',
    },
    {
      key: 'ESCALATED',
      title: 'Tickets escaladés N2',
      value: stats.escalated,
      trend: 'Transmis support N2',
      icon: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
      borderColor: 'border-t-amber-500',
      iconBg: 'bg-amber-50 dark:bg-amber-950/30',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cardData.map((card, index) => (
        <motion.div
          key={card.key}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          whileHover={{ y: -4, scale: 1.01 }}
          onClick={() => onCardClick(card.key)}
          className={`cursor-pointer n1-card border-t-4 ${card.borderColor} bg-white dark:bg-slate-900 p-6 flex items-center justify-between shadow-sm hover:shadow-md transition-all`}
        >
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
              {card.title}
            </span>
            <span className="text-3xl font-extrabold text-slate-850 dark:text-slate-100 font-mono mt-0.5 leading-none">
              {card.value}
            </span>
            <span className="text-[10px] text-slate-450 dark:text-slate-400 mt-1">
              {card.trend}
            </span>
          </div>
          <div className={`p-3.5 ${card.iconBg} rounded-xl flex items-center justify-center flex-shrink-0`}>
            {card.icon}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
