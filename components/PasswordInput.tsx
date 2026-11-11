'use client';

import { useState, type InputHTMLAttributes } from 'react';

// Polje za lozinku s dugmetom "oko": lozinka je skrivena dok je korisnik sam ne prikaže.
export default function PasswordInput({ className = '', ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={visible ? 'text' : 'password'} className={`${className} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Sakrij lozinku' : 'Prikaži lozinku'}
        aria-pressed={visible}
        title={visible ? 'Sakrij lozinku' : 'Prikaži lozinku'}
        className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-slate-400 transition hover:text-white focus-visible:outline-2 focus-visible:outline-blue-400"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {visible ? (
            <>
              <path d="M3 3l18 18" />
              <path d="M10.6 5.1A9.8 9.8 0 0 1 12 5c5 0 8.5 4.5 9.5 7a12 12 0 0 1-2.4 3.5M6.2 6.3C4.3 7.6 3 9.6 2.5 12c1 2.5 4.5 7 9.5 7 1.7 0 3.2-.5 4.5-1.3" />
              <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
            </>
          ) : (
            <>
              <path d="M2.5 12C3.5 9.5 7 5 12 5s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  );
}
