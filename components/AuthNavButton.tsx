'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

export default function AuthNavButton() {
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLoggedIn(!!session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setLoggedIn(!!session));
    return () => listener.subscription.unsubscribe();
  }, []);

  return (
    <Link
      href="/nalog"
      className="rounded-xl border border-[#1d5bff]/40 bg-[#0a1a3d] px-4 py-2 text-sm font-semibold text-blue-300 transition hover:bg-[#10276a]"
    >
      {loggedIn ? 'Moj nalog' : 'Prijava'}
    </Link>
  );
}