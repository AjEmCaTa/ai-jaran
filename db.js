const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('./ai_jaran.db', (err) => {
    if (err) {
        console.error('Greška pri otvaranju baze:', err.message);
    } else {
        console.log('Uspješno spojen na lokalnu SQLite bazu za AI Jarana!');
    }
});

// Kreiramo tabelu prilagođenu firmama i paketima
db.run(`CREATE TABLE IF NOT EXISTS narudzbe_firmi (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    naziv_firme TEXT,
    opis_firme TEXT,
    izabrani_paket TEXT,
    kontakt TEXT,
    datum TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`, (err) => {
    if (!err) {
        console.log('Tabela "narudzbe_firmi" je spremna za akciju!');
    }
});

module.exports = db;