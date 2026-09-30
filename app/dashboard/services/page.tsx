'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

type Service = {
  id: string;
  name: string;
  description: string | null;
  duration: string | null;
  price: number;
};

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [hasBusiness, setHasBusiness] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('');
  const [price, setPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchServices = async () => {
    if (!supabase) {
      setLoading(false);
      setErrorMsg('Supabase nije konfigurisan.');
      return;
    }

    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Prijavite se ponovo za upravljanje uslugama.');
      const response = await fetch('/api/dashboard/services', { headers: { Authorization: `Bearer ${session.access_token}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Usluge nije moguće učitati.');
      setServices(result.services || []);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Usluge nije moguće učitati.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      if (!supabase) {
        setLoading(false);
        return;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }
      setHasBusiness(true);
      fetchServices();
    }
    init();
  }, []);

  const handleOpenModal = (service: Service | null = null) => {
    if (service) {
      setEditingService(service);
      setName(service.name || '');
      setDescription(service.description || '');
      setDuration(service.duration || '');
      setPrice(String(service.price ?? ''));
    } else {
      setEditingService(null);
      setName('');
      setDescription('');
      setDuration('');
      setPrice('');
    }
    setIsModalOpen(true);
  };

  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !hasBusiness) return;

    try {
      setSubmitting(true);

      const serviceData = {
        name,
        description,
        duration,
        price: parseFloat(price) || 0,
      };
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Prijavite se ponovo za izmjenu usluge.');
      const response = await fetch('/api/dashboard/services', {
        method: editingService ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify(editingService ? { ...serviceData, id: editingService.id } : serviceData),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Uslugu nije moguće sačuvati.');

      setIsModalOpen(false);
      await fetchServices();
    } catch (err) {
      alert('Greška pri snimanju: ' + (err instanceof Error ? err.message : 'Pokušajte ponovo.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu uslugu?')) return;
    if (!supabase || !hasBusiness) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Prijavite se ponovo za brisanje usluge.');
      const response = await fetch('/api/dashboard/services', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ id }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Uslugu nije moguće obrisati.');
      await fetchServices();
    } catch (err) {
      alert('Greška pri brisanju: ' + (err instanceof Error ? err.message : 'Pokušajte ponovo.'));
    }
  };

  return (
    <div className="space-y-6 text-gray-100 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">Usluge i cjenovnik</h2>
          <p className="text-slate-400 text-sm mt-1">Definiši usluge koje nudiš, njihovo trajanje i cijene koje vide klijenti.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          disabled={!hasBusiness}
          className="inline-flex min-h-11 w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-blue-600/30 transition hover:bg-blue-500 disabled:opacity-50 sm:w-auto"
        >
          + Nova usluga
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-xl text-sm">
          Greška: {errorMsg}
        </div>
      )}

      <div className="hidden overflow-hidden rounded-2xl border border-gray-800 bg-gray-900/60 shadow-xl backdrop-blur-md lg:block">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950/60 border-b border-gray-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <th className="py-4 px-6">Naziv usluge</th>
                <th className="py-4 px-6">Opis</th>
                <th className="py-4 px-6">Trajanje</th>
                <th className="py-4 px-6">Cijena</th>
                <th className="py-4 px-6 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">Učitavanje podataka iz baze...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Nemate kreiranih usluga. Kliknite gore desno na &quot;+ Nova usluga&quot; da dodate prvu.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="py-4 px-6 font-semibold text-white">{service.name}</td>
                    <td className="py-4 px-6 text-slate-400">{service.description || '-'}</td>
                    <td className="py-4 px-6 text-slate-400">{service.duration || '-'}</td>
                    <td className="py-4 px-6 font-bold text-white">{service.price} KM</td>
                    <td className="py-4 px-6 text-right space-x-3">
                      <button
                        onClick={() => handleOpenModal(service)}
                        className="text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                      >
                        Uredi
                      </button>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                      >
                        Obriši
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3 lg:hidden">
        {loading ? <p className="py-10 text-center text-sm text-slate-500">Učitavanje usluga...</p>
          : services.length === 0 ? <p className="rounded-xl border border-gray-800 bg-gray-900/60 px-4 py-10 text-center text-sm text-slate-500">Nemate kreiranih usluga. Dodajte prvu uslugu.</p>
            : services.map((service) => (
              <article key={service.id} className="space-y-3 rounded-xl border border-gray-800 bg-gray-900/70 p-4">
                <div className="min-w-0">
                  <h3 className="break-words font-semibold text-white">{service.name}</h3>
                  {service.description && <p className="mt-1 break-words text-sm text-slate-400">{service.description}</p>}
                </div>
                <dl className="grid grid-cols-2 gap-3 border-t border-gray-800 pt-3 text-xs">
                  <div><dt className="text-slate-500">Trajanje</dt><dd className="mt-1 text-slate-200">{service.duration || '-'}</dd></div>
                  <div><dt className="text-slate-500">Cijena</dt><dd className="mt-1 font-semibold text-white">{service.price} KM</dd></div>
                </dl>
                <div className="flex gap-2 border-t border-gray-800 pt-3">
                  <button onClick={() => handleOpenModal(service)} className="min-h-11 flex-1 rounded-lg border border-blue-500/30 bg-blue-600/10 px-3 py-2 text-sm font-semibold text-blue-300">Uredi</button>
                  <button onClick={() => handleDeleteService(service.id)} className="min-h-11 flex-1 rounded-lg border border-red-500/30 bg-red-600/10 px-3 py-2 text-sm font-semibold text-red-300">Obriši</button>
                </div>
              </article>
            ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-4">
          <div className="max-h-[90dvh] w-full max-w-md space-y-6 overflow-y-auto rounded-2xl border border-gray-800 bg-gray-900 p-4 shadow-2xl sm:p-6">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingService ? 'Uredi uslugu' : 'Nova usluga'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Naziv usluge</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="npr. Dubinsko čišćenje sjedala"
                  className="min-h-11 w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Opis</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Kratak opis šta usluga uključuje..."
                  rows={2}
                  className="min-h-11 w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Trajanje</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    placeholder="npr. 2 sata"
                    className="min-h-11 w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Cijena (KM)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    required
                    placeholder="25"
                    className="min-h-11 w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex flex-col-reverse gap-2 border-t border-gray-800 pt-4 sm:flex-row sm:justify-end sm:gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="min-h-11 px-4 py-2 bg-gray-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-gray-700 transition cursor-pointer"
                >
                  Odustani
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="min-h-11 px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
                >
                  {submitting ? 'Snimanje...' : 'Sačuvaj uslugu'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}