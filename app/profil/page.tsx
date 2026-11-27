'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent, type ReactNode } from 'react';
import { readKeep, writeKeep } from '../../utils/quickCache';
import { createClient, type User } from '@supabase/supabase-js';
import Icon, { type IconName } from '../../components/Icon';
import { useLang, useT } from '../../components/site/LangProvider';
import { authErrorText } from '../../utils/authErrors';

// Moj profil (klijenti i vlasnici): podaci, e-mail, lozinka, jezik, brisanje računa, odjava.

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
);

const TEXT = {
  bs: {
    title: 'Moj profil', total: 'Ukupno termina', done: 'Završenih', cancelled: 'Otkazanih',
    edit: 'Uredi profil', editSub: 'Ime i broj telefona', name: 'Ime i prezime', phone: 'Broj telefona',
    email: 'E-mail', emailSub: 'Promjena e-mail adrese', newEmail: 'Novi e-mail',
    password: 'Lozinka', passwordSub: 'Promjena lozinke', newPassword: 'Nova lozinka', repeat: 'Ponovi lozinku',
    save: 'Spremi', saving: 'Spremam...', saved: 'Spremljeno.',
    emailSent: 'Poslali smo link na novi e-mail. Promjena važi kad kliknete na njega.',
    short: 'Lozinka mora imati najmanje 6 znakova.', mismatch: 'Lozinke se ne poklapaju.',
    myBookings: 'Moji termini', panel: 'Moj panel', panelSub: 'Upravljanje firmom',
    language: 'Jezik', terms: 'Uslovi korištenja', privacy: 'Privatnost', contact: 'Pomoć i kontakt',
    delete: 'Brisanje računa', deleteSub: 'Trajno briše vaš račun',
    deleteTitle: 'Obrisati račun?',
    deleteText: 'Vaš račun se trajno briše i više se nećete moći prijaviti. Termini koje ste zakazali ostaju zabilježeni kod firmi.',
    deleteConfirm: 'Da, obriši račun', deleting: 'Brišem...', cancel: 'Odustani',
    logout: 'Odjavi se', failed: 'Nije uspjelo. Pokušajte ponovo.', guest: 'Korisnik',
    changePhoto: 'Promijeni sliku', removePhoto: 'Ukloni sliku', uploading: 'Šaljem sliku...',
  },
  en: {
    title: 'My profile', total: 'Total bookings', done: 'Completed', cancelled: 'Cancelled',
    edit: 'Edit profile', editSub: 'Name and phone number', name: 'Full name', phone: 'Phone number',
    email: 'Email', emailSub: 'Change email address', newEmail: 'New email',
    password: 'Password', passwordSub: 'Change password', newPassword: 'New password', repeat: 'Repeat password',
    save: 'Save', saving: 'Saving...', saved: 'Saved.',
    emailSent: 'We sent a link to the new email. The change applies once you click it.',
    short: 'Password must have at least 6 characters.', mismatch: 'Passwords do not match.',
    myBookings: 'My bookings', panel: 'My panel', panelSub: 'Manage your business',
    language: 'Language', terms: 'Terms of use', privacy: 'Privacy', contact: 'Help and contact',
    delete: 'Delete account', deleteSub: 'Permanently deletes your account',
    deleteTitle: 'Delete your account?',
    deleteText: 'Your account is permanently deleted and you will not be able to sign in again. Bookings you made stay recorded with the businesses.',
    deleteConfirm: 'Yes, delete account', deleting: 'Deleting...', cancel: 'Cancel',
    logout: 'Log out', failed: 'Something went wrong. Please try again.', guest: 'User',
    changePhoto: 'Change photo', removePhoto: 'Remove photo', uploading: 'Uploading...',
  },
};

type Stats = { total: number; completed: number; cancelled: number; owner: boolean };
type Panel = '' | 'edit' | 'email' | 'password';

const field = 'h-12 w-full rounded-xl border border-white/10 bg-[#050913] px-4 text-[15px] text-white outline-none transition focus:border-blue-500/60';

function Row({ icon, label, sub, onClick, href, danger, open }: { icon: IconName; label: string; sub?: string; onClick?: () => void; href?: string; danger?: boolean; open?: boolean }) {
  const inner = (
    <>
      <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${danger ? 'bg-red-500/10 text-red-300' : 'bg-white/[0.05] text-blue-300'}`}>
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <span className="min-w-0 flex-1 text-left">
        <span className={`block text-[15px] font-semibold ${danger ? 'text-red-300' : 'text-white'}`}>{label}</span>
        {sub && <span className="block text-xs text-slate-400">{sub}</span>}
      </span>
      <span className={`text-lg text-slate-500 transition-transform duration-200 ${open ? 'rotate-90' : ''}`}>›</span>
    </>
  );
  const cls = 'app-press flex w-full items-center gap-3 px-4 py-3.5 transition-colors hover:bg-white/[0.03]';
  return href ? <Link href={href} className={cls}>{inner}</Link> : <button type="button" onClick={onClick} className={cls}>{inner}</button>;
}

function Card({ children }: { children: ReactNode }) {
  return <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b1020]">{children}</div>;
}

export default function ProfilPage() {
  const router = useRouter();
  const t = useT(TEXT);
  const { lang, setLang } = useLang();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [open, setOpen] = useState<Panel>('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [busy, setBusy] = useState('');
  const [note, setNote] = useState<{ tone: 'ok' | 'err'; text: string; at: Panel | 'delete' | 'photo' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Slika se smanji na 320x320 (kvadrat iz sredine) prije slanja.
  const shrink = (file: File) =>
    new Promise<Blob>((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const size = 320;
        const c = document.createElement('canvas');
        c.width = size;
        c.height = size;
        const side = Math.min(img.width, img.height);
        c.getContext('2d')?.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
        URL.revokeObjectURL(img.src);
        c.toBlob((b) => (b ? resolve(b) : reject(new Error('image'))), 'image/jpeg', 0.86);
      };
      img.onerror = () => reject(new Error('image'));
      img.src = URL.createObjectURL(file);
    });

  const uploadPhoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('photo');
    setNote(null);
    try {
      const blob = await shrink(file);
      const form = new FormData();
      form.append('avatar', blob, 'avatar.jpg');
      const res = await fetch('/api/nalog/avatar', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || t.failed);
      const { data } = await supabase.auth.refreshSession();
      if (data.user) setUser(data.user);
      if (data.session) setToken(data.session.access_token);
    } catch (err) {
      setNote({ tone: 'err', text: err instanceof Error && err.message !== 'image' ? err.message : t.failed, at: 'photo' });
    } finally {
      setBusy('');
    }
  };

  const removePhoto = async () => {
    setBusy('photo');
    try {
      const res = await fetch('/api/nalog/avatar', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || t.failed);
      const { data } = await supabase.auth.refreshSession();
      if (data.user) setUser(data.user);
      if (data.session) setToken(data.session.access_token);
    } catch (err) {
      setNote({ tone: 'err', text: err instanceof Error ? err.message : t.failed, at: 'photo' });
    } finally {
      setBusy('');
    }
  };

  // Zadnji poznati brojevi i "Moj panel" odmah, prije prvog iscrtavanja (bez crtica i bez skakanja).
  useLayoutEffect(() => {
    const kept = readKeep<{ uid: string; stats: Stats }>('profile-stats');
    if (kept?.stats) setStats(kept.stats);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        router.replace('/nalog?next=/profil');
        return;
      }
      setUser(session.user);
      setToken(session.access_token);
      setName(String(session.user.user_metadata?.full_name || session.user.user_metadata?.name || ''));
      setPhone(String(session.user.user_metadata?.phone || ''));
      const kept = readKeep<{ uid: string; stats: Stats }>('profile-stats');
      if (kept && kept.uid !== session.user.id) {
        writeKeep('profile-stats', null);
        setStats(null);
      }
      try {
        const res = await fetch('/api/nalog/profil', { headers: { Authorization: `Bearer ${session.access_token}` } });
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
          writeKeep('profile-stats', { uid: session.user.id, stats: json.data });
        }
      } catch {}
    });
  }, [router]);

  const toggle = (p: Panel) => {
    setNote(null);
    setOpen((cur) => (cur === p ? '' : p));
  };

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('edit');
    const { data, error } = await supabase.auth.updateUser({ data: { full_name: name.trim(), phone: phone.trim() } });
    setBusy('');
    if (error) return setNote({ tone: 'err', text: authErrorText(error, lang, t.failed), at: 'edit' });
    if (data.user) setUser(data.user);
    setNote({ tone: 'ok', text: t.saved, at: 'edit' });
  };

  const saveEmail = async (e: FormEvent) => {
    e.preventDefault();
    setBusy('email');
    const { error } = await supabase.auth.updateUser(
      { email: email.trim() },
      { emailRedirectTo: new URL('/profil', window.location.origin).toString() },
    );
    setBusy('');
    if (error) return setNote({ tone: 'err', text: authErrorText(error, lang, t.failed), at: 'email' });
    setEmail('');
    setNote({ tone: 'ok', text: t.emailSent, at: 'email' });
  };

  const savePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) return setNote({ tone: 'err', text: t.short, at: 'password' });
    if (pw !== pw2) return setNote({ tone: 'err', text: t.mismatch, at: 'password' });
    setBusy('password');
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy('');
    if (error) return setNote({ tone: 'err', text: authErrorText(error, lang, t.failed), at: 'password' });
    setPw('');
    setPw2('');
    setNote({ tone: 'ok', text: t.saved, at: 'password' });
  };

  const deleteAccount = async () => {
    setBusy('delete');
    try {
      const res = await fetch('/api/nalog/profil', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || t.failed);
      await supabase.auth.signOut();
      const installed = document.documentElement.classList.contains('app-mode');
      router.replace(installed ? '/app' : '/');
    } catch (err) {
      setConfirmDelete(false);
      setNote({ tone: 'err', text: err instanceof Error ? err.message : t.failed, at: 'delete' });
    } finally {
      setBusy('');
    }
  };

  const logout = async () => {
    setBusy('logout');
    await supabase.auth.signOut();
    const installed = document.documentElement.classList.contains('app-mode');
    router.replace(installed ? '/app' : '/');
  };

  if (!user) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center bg-[#030712]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500/30 border-t-blue-500" />
      </main>
    );
  }

  const displayName = name || user.email?.split('@')[0] || t.guest;
  const ownPhoto = String(user.user_metadata?.poslo_avatar || '');
  const photo = ownPhoto || String(user.user_metadata?.avatar_url || user.user_metadata?.picture || '');
  const initials = displayName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'P';
  const Note = ({ at }: { at: Panel | 'delete' | 'photo' }) =>
    note && note.at === at ? (
      <p className={`app-fade text-sm ${note.tone === 'ok' ? 'text-emerald-300' : 'text-red-300'}`}>{note.text}</p>
    ) : null;

  return (
    <main className="min-h-screen bg-[#030712] px-4 pb-10 pt-28 text-white lg:pt-32">
      <div className="mx-auto max-w-lg space-y-4">
        <section className="app-rise flex flex-col items-center pb-2 text-center">
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy !== ''} aria-label={t.changePhoto} className="app-press group relative h-24 w-24 rounded-full">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photo} alt="" referrerPolicy="no-referrer" className="h-24 w-24 rounded-full object-cover shadow-[0_18px_50px_rgba(37,99,235,0.35)] ring-2 ring-white/10" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-3xl font-black shadow-[0_18px_50px_rgba(37,99,235,0.35)]">{initials}</span>
            )}
            <span className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#030712] bg-blue-600 text-white">
              {busy === 'photo' ? <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Icon name="plus" className="h-4 w-4" />}
            </span>
          </button>
          <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={uploadPhoto} />
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">{displayName}</h1>
          <p className="mt-1 text-sm text-slate-400">{user.email}</p>
          <div className="mt-2 flex items-center gap-3 text-xs font-semibold">
            <button type="button" onClick={() => fileRef.current?.click()} disabled={busy !== ''} className="text-blue-300">{busy === 'photo' ? t.uploading : t.changePhoto}</button>
            {ownPhoto && <><span className="text-slate-600">·</span><button type="button" onClick={removePhoto} disabled={busy !== ''} className="text-slate-400">{t.removePhoto}</button></>}
          </div>
          <div className="mt-2"><Note at="photo" /></div>
        </section>

        <section className="app-rise grid grid-cols-3 overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0b1020] text-center" style={{ animationDelay: '0.06s' }}>
          {[
            { v: stats?.total, l: t.total, c: 'text-blue-300' },
            { v: stats?.completed, l: t.done, c: 'text-emerald-300' },
            { v: stats?.cancelled, l: t.cancelled, c: 'text-slate-300' },
          ].map((s, i) => (
            <div key={i} className={`px-2 py-4 ${i ? 'border-l border-white/[0.06]' : ''}`}>
              <p className={`text-2xl font-black ${s.c}`}>{s.v ?? '–'}</p>
              <p className="mt-1 text-[11px] leading-tight text-slate-400">{s.l}</p>
            </div>
          ))}
        </section>

        <div className="app-rise space-y-4" style={{ animationDelay: '0.12s' }}>
          {stats?.owner && (
            // Panel je odvojen i drugačije obojen, da se ne pomiješa s "Moji termini".
            <Link href="/dashboard" className="app-press flex items-center gap-3 rounded-3xl border border-blue-500/30 bg-gradient-to-br from-blue-600/20 to-violet-600/15 px-4 py-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white"><Icon name="dashboard" className="h-5 w-5" /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-[15px] font-bold text-white">{t.panel}</span>
                <span className="block text-xs text-blue-200/80">{t.panelSub}</span>
              </span>
              <span className="text-lg text-blue-200">›</span>
            </Link>
          )}

          <Card>
            <Row icon="user" label={t.edit} sub={t.editSub} onClick={() => toggle('edit')} open={open === 'edit'} />
            {open === 'edit' && (
              <form onSubmit={saveProfile} className="app-fade space-y-3 px-4 pb-4 pt-1">
                <input className={field} value={name} onChange={(e) => setName(e.target.value)} placeholder={t.name} autoComplete="name" />
                <input className={field} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={t.phone} type="tel" autoComplete="tel" />
                <Note at="edit" />
                <button disabled={busy !== ''} className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold disabled:opacity-50">{busy === 'edit' ? t.saving : t.save}</button>
              </form>
            )}
            <Row icon="mail" label={t.email} sub={user.email || t.emailSub} onClick={() => toggle('email')} open={open === 'email'} />
            {open === 'email' && (
              <form onSubmit={saveEmail} className="app-fade space-y-3 px-4 pb-4 pt-1">
                <input className={field} value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t.newEmail} type="email" required autoComplete="email" />
                <Note at="email" />
                <button disabled={busy !== ''} className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold disabled:opacity-50">{busy === 'email' ? t.saving : t.save}</button>
              </form>
            )}
            <Row icon="shield" label={t.password} sub={t.passwordSub} onClick={() => toggle('password')} open={open === 'password'} />
            {open === 'password' && (
              <form onSubmit={savePassword} className="app-fade space-y-3 px-4 pb-4 pt-1">
                <input className={field} value={pw} onChange={(e) => setPw(e.target.value)} placeholder={t.newPassword} type="password" autoComplete="new-password" />
                <input className={field} value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder={t.repeat} type="password" autoComplete="new-password" />
                <Note at="password" />
                <button disabled={busy !== ''} className="h-12 w-full rounded-xl bg-blue-600 text-sm font-bold disabled:opacity-50">{busy === 'password' ? t.saving : t.save}</button>
              </form>
            )}
          </Card>

          <Card>
            <Row icon="calendar" label={t.myBookings} href="/termini" />
            <div className="flex items-center gap-3 px-4 py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.05] text-blue-300"><Icon name="message" className="h-5 w-5" /></span>
              <span className="flex-1 text-[15px] font-semibold">{t.language}</span>
              <div className="flex rounded-xl bg-white/[0.05] p-1 text-xs font-bold">
                {(['bs', 'en'] as const).map((l) => (
                  <button key={l} type="button" onClick={() => setLang(l)} className={`h-8 w-11 rounded-lg ${lang === l ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>{l.toUpperCase()}</button>
                ))}
              </div>
            </div>
          </Card>

          <Card>
            <Row icon="check" label={t.terms} href="/uslovi" />
            <Row icon="shield" label={t.privacy} href="/privatnost" />
            <Row icon="mail" label={t.contact} href="mailto:info@poslo.one" />
          </Card>

          <Card>
            <Row icon="close" label={t.delete} sub={t.deleteSub} danger onClick={() => { setNote(null); setConfirmDelete(true); }} />
          </Card>
          <Note at="delete" />

          <button type="button" onClick={logout} disabled={busy !== ''} className="app-press h-14 w-full rounded-2xl border border-red-500/25 bg-red-500/[0.06] text-[15px] font-bold text-red-300 disabled:opacity-50">
            {t.logout}
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={t.deleteTitle}>
          <button aria-label={t.cancel} onClick={() => setConfirmDelete(false)} className="app-fade absolute inset-0 bg-black/70 backdrop-blur-sm" />
          <div className="app-sheet relative w-full max-w-md rounded-t-[28px] border border-white/10 bg-[#0a0f1e] p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] sm:rounded-[28px]">
            <h2 className="text-xl font-extrabold">{t.deleteTitle}</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-400">{t.deleteText}</p>
            <div className="mt-6 space-y-2">
              <button type="button" onClick={deleteAccount} disabled={busy !== ''} className="h-12 w-full rounded-xl bg-red-600 text-sm font-bold disabled:opacity-50">{busy === 'delete' ? t.deleting : t.deleteConfirm}</button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="h-12 w-full rounded-xl border border-white/10 text-sm font-semibold text-slate-200">{t.cancel}</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
