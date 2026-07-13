"use client";

import Image from "next/image";

export default function Navbar() {
  return (
    <header className="fixed top-0 left-0 z-50 w-full border-b border-white/10 bg-[#090909]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

        {/* LOGO */}
        <a
          href="/"
          className="group flex items-center"
        >
          <Image
            src="/logo.png"
            alt="AI JARAN"
            width={58}
            height={58}
            priority
            className="transition-all duration-300 group-hover:scale-110 group-hover:rotate-3"
          />
        </a>

        {/* MENU */}
        <nav className="hidden items-center gap-10 md:flex">

          <a
            href="#"
            className="text-white transition hover:text-blue-500"
          >
            Početna
          </a>

          <a
            href="#features"
            className="text-white transition hover:text-blue-500"
          >
            Mogućnosti
          </a>

          <a
            href="#demo"
            className="text-white transition hover:text-blue-500"
          >
            Demo
          </a>

          <a
            href="#pricing"
            className="text-white transition hover:text-blue-500"
          >
            Cijene
          </a>

          <a
            href="#contact"
            className="rounded-full border border-blue-500 px-5 py-2 text-blue-500 transition hover:bg-blue-500 hover:text-white"
          >
            Kontakt
          </a>

        </nav>

      </div>
    </header>
  );
}