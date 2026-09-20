import React from 'react';
import { Inbox, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RecentTickets({ tickets, onStart, onViewAll, getPriorityBadge }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="n1-card bg-white dark:bg-slate-900 p-6 shadow-sm mb-6"
    >
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
        <div>
          <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base leading-tight">
            Derniers tickets en file d'attente
          </h3>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Incidents disponibles à prendre en charge par le support N1
          </p>
        </div>
        <button
          className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-500 hover:text-emerald-700 dark:hover:text-emerald-400 transition-colors focus:outline-none"
          onClick={onViewAll}
        >
          Voir tout <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <Inbox className="h-12 w-12 text-slate-350 dark:text-slate-700 mb-2" />
          <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">File d'attente vide</p>
          <p className="text-xs text-slate-450 dark:text-slate-400 mt-1">
            Aucun ticket disponible dans la file d'attente générale.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {tickets.slice(0, 4).map((ticket, index) => (
            <motion.div
              key={ticket.id}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-all"
            >
              <div className="flex flex-col gap-1 flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    Ticket #{ticket.id}
                  </span>
                  {getPriorityBadge(ticket.priorite)}
                </div>
                <h4 className="font-bold text-slate-850 dark:text-slate-205 text-sm truncate">
                  {ticket.titre}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-normal">
                  {ticket.description}
                </p>
              </div>

              <div className="flex-shrink-0 w-full sm:w-auto">
                <button
                  className="w-full sm:w-auto px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all focus:outline-none"
                  onClick={() => onStart(ticket.id)}
                >
                  Prendre en charge
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
