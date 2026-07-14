"use client";

import { motion } from "framer-motion";

export default function Background() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-[#050816]">

      {/* GRID */}
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:42px_42px]"
        style={{
          maskImage:
            "radial-gradient(circle at center,#000 45%,transparent 100%)",
          WebkitMaskImage:
            "radial-gradient(circle at center,#000 45%,transparent 100%)",
        }}
      />

      {/* PLAVA KUGLA */}
      <motion.div
        animate={{
          x: [0, 120, 0],
          y: [0, 60, 0],
          scale: [1, 1.25, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        className="absolute left-[-150px] top-[5%] h-[700px] w-[700px] rounded-full bg-blue-500/20 blur-[180px]"
      />

      {/* LJUBIČASTA KUGLA */}
      <motion.div
        animate={{
          x: [0, -120, 0],
          y: [0, -60, 0],
          scale: [1.2, 1, 1.2],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "mirror",
          ease: "easeInOut",
        }}
        className="absolute right-[-180px] top-[30%] h-[700px] w-[700px] rounded-full bg-purple-500/20 blur-[180px]"
      />

      {/* DODATNI PLAVI GLOW */}
      <motion.div
        animate={{
          opacity: [0.15, 0.35, 0.15],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute left-1/2 top-[65%] h-[500px] w-[500px] -translate-x-1/2 rounded-full bg-cyan-500/10 blur-[160px]"
      />

      {/* VINJETA */}
      <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_35%,#050816_100%)]" />

    </div>
  );
}