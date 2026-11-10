
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

export default function Modal({
  open,
  onClose,
  title,
  children,
}){
    console.log(title)
    console.log(children)
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            className="modal"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2 }}
          >
            <div className="modal-header">
              <h3>{title}</h3>
              <button className="icon-button" onClick={onClose}>
                <X size={19} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
