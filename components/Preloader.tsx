"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Provjeri da li je preloader već prikazan u ovoj sesiji
    const hasSeenPreloader = sessionStorage.getItem("ai_jaran_preload");

    if (!hasSeenPreloader) {
      setIsVisible(true);
      sessionStorage.setItem("ai_jaran_preload", "true");

      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 1800);

      return () => clearTimeout(timer);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ 
          y: "-100%", 
          transition: { duration: 0.7, ease: [0.76, 0, 0.24, 1] } 
        }}
        className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030712]"
      >
        <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

        <div className="relative flex flex-col items-center gap-6">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{ mixBlendMode: "screen" }}
          >
            <Image
              src="/logo.png"
              alt="AI JARAN"
              width={120}
              height={120}
              priority
              style={{
                mixBlendMode: "screen",
                filter: "brightness(1.2) contrast(1.2)",
              }}
            />
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="flex flex-col items-center gap-2"
          >
            <span className="text-xl font-bold tracking-[0.2em] text-white uppercase">
              AI JARAN
            </span>
            <div className="h-[2px] w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full overflow-hidden relative">
              <motion.div 
                initial={{ left: "-100%" }}
                animate={{ left: "100%" }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.2, 
                  ease: "easeInOut" 
                }}
                className="absolute top-0 bottom-0 w-1/2 bg-white"
              />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}