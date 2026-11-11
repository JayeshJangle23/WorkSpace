import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop-bg fixed inset-0 grid place-items-center p-5 z-[100] overflow-y-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
          <motion.div
            className="card w-full max-w-[480px] max-h-[90dvh] overflow-y-auto p-5 modal-mobile-full"
            style={{ boxShadow: "var(--shadow-lg)" }}
            initial={{ opacity: 0, scale: 0.93, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-token text-[17px] font-bold m-0">{title}</h3>
              <button className="btn-icon" onClick={onClose}>
                <X size={18} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
