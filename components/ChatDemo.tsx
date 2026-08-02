"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ChatDemo({ t }: { t?: any }) {
  const [messages, setMessages] = useState([
    { sender: "ai", text: t?.initialMessage || "Ćao! Ja sam AI Jaran. Kako ti mogu pomoći oko rezervacija ili upita danas?" }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  // Ažuriraj inicijalnu poruku ako se promijeni jezik (t?.initialMessage)
  useEffect(() => {
    setMessages([
      { sender: "ai", text: t?.initialMessage || "Ćao! Ja sam AI Jaran. Kako ti mogu pomoći oko rezervacija ili upita danas?" }
    ]);
  }, [t]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setMessages(prev => [...prev, { sender: "user", text: userMsg }]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      let reply = t?.defaultReply || "To zvuči odlično! Mogu li te zabilježiti za termin ili imaš još neko pitanje?";
      const lower = userMsg.toLowerCase();

      if (lower.includes("termin") || lower.includes("rezerv") || lower.includes("book") || lower.includes("slot")) {
        reply = t?.replyBooking || "Može, dogovoreno! Upisujem termin u kalendar, a potvrda stiže u sekundi.";
      } else if (lower.includes("cijen") || lower.includes("price") || lower.includes("kolko") || lower.includes("pošto") || lower.includes("vikendic") || lower.includes("cottage")) {
        reply = t?.replyPricing || "Imamo odlične ponude i slobodne termine u bazi. Cijene se prilagođavaju vašim željama, želite li da provjerimo dostupnost?";
      } else if (lower.includes("zdravo") || lower.includes("cao") || lower.includes("hello") || lower.includes("hi")) {
        reply = t?.replyHello || "Ćao! Tu sam da preuzmem brigu oko poruka i preporuka iz baze dok ti odmaraš.";
      }

      setMessages(prev => [...prev, { sender: "ai", text: reply }]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <section id="demo" className="py-24 px-6 bg-transparent">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
            {t?.title || "Isprobaj"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">AI Jarana</span> {t?.titleEnd || "u akciji"}
          </h2>
          <p className="text-gray-400 text-lg">
            {t?.subtitle || "Pošalji poruku i uvjeri se kako Jaran odgovara prirodno, brzo i tačno."}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
          {/* Chat Header */}
          <div className="bg-white/[0.04] border-b border-white/10 px-6 py-4 flex items-center gap-4">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-600/30">
                AI
              </div>
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-green-500 border-2 border-[#030712]" />
            </div>
            <div>
              <h3 className="font-bold text-white">AI Jaran</h3>
              <p className="text-xs text-green-400">{t?.onlineStatus || "Online • Spremno za razgovor"}</p>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 flex flex-col">
            {messages.map((msg, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-blue-600 text-white rounded-br-none shadow-lg shadow-blue-600/20"
                      : "bg-white/10 text-gray-200 rounded-bl-none border border-white/5"
                  }`}
                >
                  {msg.text}
                </div>
              </motion.div>
            ))}

            {isTyping && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="bg-white/10 text-gray-400 rounded-2xl rounded-bl-none px-5 py-3 text-sm flex items-center gap-2 border border-white/5">
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-blue-400 animate-bounce [animation-delay:0.4s]" />
                </div>
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="p-4 bg-white/[0.02] border-t border-white/10 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t?.placeholder || "Npr. Kako funkcioniše rezervacija termina?"}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-2xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/30 flex items-center justify-center"
            >
              {t?.sendBtn || "Pošalji"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}