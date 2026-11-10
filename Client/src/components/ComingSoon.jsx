
import { motion } from "framer-motion";
import { Construction } from "lucide-react";

export default function ComingSoon({ title, description, models }) {
  return (
    <motion.div
      className="coming-soon panel"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="coming-icon">
        <Construction size={34} />
      </div>

      <h2>{title}</h2>
      <p>{description}</p>

      <span className="status pending-status">
        Backend integration pending
      </span>

      <div className="model-list">
        <strong>Database models</strong>
        {models.map(model => (
          <span key={model}>{model}</span>
        ))}
      </div>
    </motion.div>
  );
}
