"use client";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AnimatedLogo() {
  return (
    <motion.div 
      whileHover={{ scale: 1.05 }}
      className="flex items-center gap-3"
    >
      <Image
        src="/logo.png"
        alt="AI Jaran Logo"
        width={40}
        height={40}
        className="rounded-xl"
        style={{ mixBlendMode: "screen" }}
      />
      <span className="font-extrabold tracking-wider text-white text-lg">AI JARAN</span>
    </motion.div>
  );
}