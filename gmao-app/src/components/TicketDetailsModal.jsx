import { X, Info, User, Phone, Mail, Cpu, Calendar } from "lucide-react";

export default function TicketModal({ ticket, onClose }) {
  if (!ticket) return null;

  return (
    <div className="ddm-modal-overlay">

      {/* MODAL */}
      <div className="ddm-modal-content" style={{ width: '620px', maxWidth: '95%' }}>

        {/* HEADER */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-emerald-600 text-white p-5 flex justify-between items-center">

          <div className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            <h2 className="text-lg font-bold tracking-wide drop-shadow">
              Consultation Ticket #{ticket.id}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/10 hover:bg-red-500/20 transition"
          >
            <X className="w-5 h-5" />
            <span className="text-sm">Fermer</span>
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-4 text-sm bg-slate-50">

          {/* STATUS */}
          <div className="flex gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-medium">
              Priorité: {ticket.priorite}
            </span>

            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-medium">
              Statut: {ticket.statut}
            </span>
          </div>

          {/* TITLE */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition">
            <p className="text-xs text-slate-400 uppercase">Titre du ticket</p>
            <p className="font-semibold text-slate-800 mt-1">
              {ticket.titre}
            </p>
          </div>

          {/* DESCRIPTION */}
          <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md transition">
            <p className="text-xs text-slate-400 uppercase">Description</p>
            <p className="text-slate-700 whitespace-pre-wrap mt-1">
              {ticket.description}
            </p>
          </div>

          {/* DEMANDEUR */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 hover:bg-slate-50 transition">

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Demandeur
            </p>

            <div className="flex items-center gap-2 text-black">
              <User className="w-4 h-4 text-slate-500" />
              <span>{ticket.demandeur?.nom} {ticket.demandeur?.prenom}</span>
            </div>

            <div className="flex items-center gap-2 text-black">
              <Mail className="w-4 h-4 text-slate-500" />
              <span>{ticket.demandeur?.email}</span>
            </div>

            <div className="flex items-center gap-2 text-black">
              <Phone className="w-4 h-4 text-slate-500" />
              <span>{ticket.demandeur?.tel}</span>
            </div>
          </div>

          {/* EQUIPEMENT */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2 hover:bg-slate-50 transition">

            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Équipement
            </p>

            <div className="flex items-center gap-2 text-slate-700">
              <Cpu className="w-4 h-4 text-slate-500" />
              <span>{ticket.equipement?.nom}</span>
            </div>

            <div className="text-slate-600 text-xs">
              Code inventaire: {ticket.equipement?.codeInventaire}
            </div>
          </div>

          {/* DATE */}
          <div className="flex items-center gap-2 text-slate-600 text-xs bg-white border border-slate-200 p-3 rounded-xl">
            <Calendar className="w-4 h-4" />
            Créé le: {new Date(ticket.dateCreation).toLocaleString("fr-FR")}
          </div>

        </div>

        {/* FOOTER */}
        <div className="p-4 border-t bg-white flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl shadow-md hover:bg-emerald-700 hover:shadow-lg transition active:scale-95"
          >
            Fermer
          </button>
        </div>

      </div>
    </div>
  );
}