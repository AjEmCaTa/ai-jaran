'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal i form state za dodavanje/uređivanje
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<any | null>(null);
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
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase.from('services').select('*').order('created_at', { ascending: false });
      
      // Ako tabela ima user_id ili business_id, možemo filtrirati po ulogovanom korisniku
      // query = query.eq('user_id', user.id);

      const { data, error } = await query;
      if (error) throw error;
      if (data) setServices(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleOpenModal = (service: any = null) => {
    if (service) {
      setEditingService(service);
      setName(service.name || '');
      setDescription(service.description || '');
      setDuration(service.duration || '');
      setPrice(service.price || '');
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
    if (!supabase) return;

    try {
      setSubmitting(true);
      const { data: { user } } = await supabase.auth.getUser();

      const serviceData = {
        name,
        description,
        duration,
        price: parseFloat(price) || 0,
        ...(user ? { user_id: user.id } : {})
      };

      if (editingService) {
        // Ažuriranje postojeće usluge
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id);

        if (error) throw error;
      } else {
        // Unos nove usluge
        const { error } = await supabase
          .from('services')
          .insert([serviceData]);

        if (error) throw error;
      }

      setIsModalOpen(false);
      await fetchServices();
    } catch (err: any) {
      alert('Greška pri snimanju: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Da li ste sigurni da želite obrisati ovu uslugu?')) return;
    if (!supabase) return;

    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      await fetchServices();
    } catch (err: any) {
      alert('Greška pri brisanju: ' + err.message);
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
          className="inline-flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 cursor-pointer"
        >
          + Nova usluga
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-950/50 border border-red-800 text-red-200 rounded-xl text-sm">
          Greška: {errorMsg}
        </div>
      )}

      {/* Tabela usluga */}
      <div className="bg-gray-900/60 rounded-2xl border border-gray-800 shadow-xl overflow-hidden backdrop-blur-md">
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
                    Nemate kreiranih usluga. Kliknite gore desno na "+ Nova usluga" da dodate prvu.
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

      {/* MODAL ZA UNOS / UREĐIVANJE USLUGE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-6">
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
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase mb-1">Opis</label>
                <textarea 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)} 
                  placeholder="Kratak opis šta usluga uključuje..."
                  rows={2}
                  className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 text-slate-300 text-xs font-semibold rounded-xl hover:bg-gray-700 transition cursor-pointer"
                >
                  Odustani
                </button>
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="px-5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-500 transition shadow-lg shadow-blue-600/30 cursor-pointer disabled:opacity-50"
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