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

  // Funkcija za povlačenje usluga iz baze
  const fetchServices = async () => {
    if (!supabase) {
      setLoading(false);
      setErrorMsg('Supabase nije konfigurisan.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });

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

  return (
    <div className="space-y-6 text-gray-100">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Usluge i cjenovnik</h2>
          <p className="text-sm text-gray-400">Definiši usluge koje nudiš, njihovo trajanje i cijene koje vide klijenti.</p>
        </div>
        <button 
          onClick={() => alert('Ovdje otvaramo modal za unos nove usluge!')}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          + Nova usluga
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm">
          Greška: {errorMsg}
        </div>
      )}

      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Naziv usluge</th>
                <th className="py-3.5 px-6">Opis</th>
                <th className="py-3.5 px-6">Trajanje</th>
                <th className="py-3.5 px-6">Cijena</th>
                <th className="py-3.5 px-6 text-right">Akcije</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">Učitavanje podataka iz baze...</td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Nemate kreiranih usluga. Kliknite gore desno na "+ Nova usluga" da dodate prvu.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr key={service.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="py-4 px-6 font-medium text-white">{service.name}</td>
                    <td className="py-4 px-6 text-gray-400">{service.description || '-'}</td>
                    <td className="py-4 px-6 text-gray-400">{service.duration || '-'}</td>
                    <td className="py-4 px-6 font-semibold text-white">{service.price} KM</td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button className="text-blue-400 hover:text-blue-300 font-medium cursor-pointer">Uredi</button>
                      <button className="text-red-400 hover:text-red-300 font-medium cursor-pointer">Obriši</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}