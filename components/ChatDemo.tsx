"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const chats = [
  [
    { from: "user", text: "Pozdrav! Imate li termin danas?" },
    { from: "ai", text: "Naravno! Slobodni termini su u 15:00 i 17:30." },
  ],

  [
    { from: "user", text: "Želio bih rezervisati sto za 4 osobe." },
    { from: "ai", text: "Naravno! Za koji datum i u koliko sati?" },
  ],

  [
    { from: "user", text: "Da li je apartman slobodan od 15. do 18. augusta?" },
    { from: "ai", text: "Provjeravam... Da, apartman je slobodan." },
  ],

  [
    { from: "user", text: "Koliko košta Golf 8 na 3 dana?" },
    { from: "ai", text: "150 KM ukupno. Uključeno osnovno osiguranje." },
  ],

  [
    { from: "user", text: "Imate li hitan termin danas?" },
    { from: "ai", text: "Da. Slobodan termin je u 18:30." },
  ],
];

export default function ChatDemo() {
  const [chat, setChat] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setChat((prev) => (prev + 1) % chats.length);
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-[#090909] py-32">

      <div className="mx-auto max-w-3xl px-8">

        <h2 className="mb-16 text-center text-5xl font-bold text-white">
          AI JARAN <span className="text-blue-500">u akciji</span>
        </h2>

        <AnimatePresence mode="wait">

          <motion.div
            key={chat}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: .5 }}
            className="space-y-5"
          >

            {chats[chat].map((message, index) => (
              <div
                key={index}
                className={`flex ${
                  message.from === "user"
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                <div
                  className={`max-w-md rounded-3xl px-6 py-5 ${
                    message.from === "user"
                      ? "bg-blue-600 text-white"
                      : "border border-white/10 bg-[#151515] text-gray-200"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}

          </motion.div>

        </AnimatePresence>

      </div>

    </section>
  );
}