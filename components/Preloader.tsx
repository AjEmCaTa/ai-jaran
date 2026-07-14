"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";

export default function Preloader() {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Jedan jedini tajmer koji gasi preloader nakon 2 sekunde
    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ 
            y: "-100%", 
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1] } 
          }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#030712]"
        >
          {/* Suptilni sjaj iza logotipa */}
          <div className="absolute w-[300px] h-[300px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />

          {/* Kontejner za logo i animaciju */}
          <div className="relative flex flex-col items-center gap-6">
            
            {/* Animacija logotipa */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.8,
                ease: "easeOut",
              }}
              style={{
                mixBlendMode: "screen",
              }}
            >
              <Image
                src="/logo.png"
                alt="AI JARAN"
                width={120}
                height={120}
                priority // Next.js odmah učitava sliku s najvećim prioritetom
                style={{
                  mixBlendMode: "screen",
                  filter: "brightness(1.2) contrast(1.2)",
                }}
              />
            </motion.div>

            {/* Tekst ispod logotipa */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
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
                    duration: 1.5, 
                    ease: "easeInOut" 
                  }}
                  className="absolute top-0 bottom-0 w-1/2 bg-white"
                />
              </div>
            </motion.div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}