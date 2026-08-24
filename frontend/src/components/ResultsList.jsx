import { motion } from "framer-motion";
import ResultCard from "./ResultCard";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: "easeOut" },
  },
};

export default function ResultsList({ results, orgId, plainMode }) {
  return (
    <motion.div
      className="flex flex-col gap-4"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {results.map((r, i) => (
        <motion.div key={r.cve_id} variants={cardVariants}>
          <ResultCard result={r} rank={i + 1} orgId={orgId} plainMode={plainMode} />
        </motion.div>
      ))}
    </motion.div>
  );
}