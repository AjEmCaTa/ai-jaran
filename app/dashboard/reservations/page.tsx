'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Pomoćna funkcija za formatiranje datuma iz YYYY-MM-DD u DD.MM.YYYY.
const formatDate = (dateString: any) => {
  if (!dateString) return '-';
  // Ako je u formatu YYYY-MM-DD (ili ima i vrijeme na kraju pa uzimamo prvi dio)
  const cleanDate = dateString.split('T')[0];
  const parts = cleanDate.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day}.${month}.${year}.`;
  }
  return dateString;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [filter, setFilter] = useState('Sve');

  // Stanja za modal (Nova rezervacija)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [serviceName, setServiceName] = useState('Basic Paket');
  const [price, setPrice] = useState('25');
  const [reservationDate, setReservationDate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Funkcija za povlačenje rezervacija iz baze
  const fetchReservations = async () => {
    if (!supabase) {
      setLoading(false);
      setErrorMsg('Supabase nije konfigurisan.');
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setReservations(data);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, []);

  // Funkcija za snimanje nove rezervacije u bazu
  const handleCreateReservation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;

    try {
      setSubmitting(true);
      const { error } = await supabase.from('reservations').insert([
        {
          customer_name: customerName,
          customer_phone: customerPhone,
          service_name: serviceName,
          price: Number(price),
          reservation_date: reservationDate,
          status: 'Na čekanju',
        },
      ]);

      if (error) throw error;

      // Resetuj formu, zatvori modal i osvježi listu
      setIsModalOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setReservationDate('');
      fetchReservations();
    } catch (err: any) {
      alert('Greška pri kreiranju rezervacije: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 text-gray-100">
      {/* Naslov i dugme za dodavanje nove rezervacije */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Rezervacije i termini</h2>
          <p className="text-sm text-gray-400">Pregledaj sve dolaske, zakazane termine i status naplate.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
        >
          + Nova rezervacija
        </button>
      </div>

      {/* Filteri */}
      <div className="flex flex-wrap gap-2 pb-2 border-b border-gray-800">
        {['Sve', 'Na čekanju', 'Prihvaćeno', 'Završeno'].map((tab) => (
          <button 
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              filter === tab 
                ? 'bg-blue-950 text-blue-400 border border-blue-800' 
                : 'text-gray-400 hover:bg-gray-900'
            }`}
          >
            {tab === 'Sve' ? 'Sve rezervacije' : tab}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-900/50 border border-red-700 text-red-200 rounded-lg text-sm">
          Greška: {errorMsg}
        </div>
      )}

      {/* Tabela rezervacija */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-950 border-b border-gray-800 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                <th className="py-3.5 px-6">Klijent / Gost</th>
                <th className="py-3.5 px-6">Usluga / Detalji</th>
                <th className="py-3.5 px-6">Datum i vrijeme</th>
                <th className="py-3.5 px-6">Cijena</th>
                <th className="py-3.5 px-6">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">Učitavanje rezervacija iz baze...</td>
                </tr>
              ) : reservations.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-500">
                    Nemate unesenih rezervacija. Kliknite gore desno na "+ Nova rezervacija" da dodate termin.
                  </td>
                </tr>
              ) : (
                reservations
                  .filter(res => filter === 'Sve' || res.status === filter)
                  .map((res) => (
                    <tr key={res.id} className="hover:bg-gray-800/50 transition-colors">
                      <td className="py-4 px-6 font-medium text-white">
                        {res.customer_name}
                        {res.customer_phone && <span className="block text-xs text-gray-400">{res.customer_phone}</span>}
                      </td>
                      <td className="py-4 px-6 text-gray-400">{res.service_name}</td>
                      <td className="py-4 px-6 text-gray-400">{formatDate(res.reservation_date)}</td>
                      <td className="py-4 px-6 font-semibold text-white">{res.price ? `${res.price} KM` : '-'}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full border ${
                          res.status === 'Prihvaćeno' 
                            ? 'bg-green-950 text-green-400 border-green-800/50' 
                            : res.status === 'Završeno'
                            ? 'bg-blue-950 text-blue-400 border-blue-800/50'
                            : 'bg-yellow-950 text-yellow-400 border-yellow-800/50'
                        }`}>
                          {res.status || 'Na čekanju'}
                        </span>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL ZA UNOS NOVE REZERVACIJE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="text-lg font-bold text-white">Dodaj novu rezervaciju</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-white text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateReservation} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Ime i prezime klijenta</label>
                <input 
                  type="text" 
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Npr. Emir Hadžić"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Broj telefona</label>
                <input 
                  type="text" 
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="Npr. 061 123 456"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Naziv usluge / Paketa</label>
                <input 
                  type="text" 
                  required
                  value={serviceName}
                  onChange={(e) => setServiceName(e.target.value)}
                  placeholder="Npr. Premium Dubinsko"
                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Cijena (KM)</label>
                  <input 
                    type="number" 
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Datum i vrijeme</label>
                  <input 
                    type="text" 
                    required
                    value={reservationDate}
                    onChange={(e) => setReservationDate(e.target.value)}
                    placeholder="Sutra u 10:00"
                    className="w-full bg-gray-950 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-medium rounded-lg transition-colors"
                >
                  Otkaži
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? 'Spremanje...' : 'Sačuvaj rezervaciju'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}