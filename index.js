const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');
const cors = require('cors');
require('dotenv').config();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false })); // Mendukung form-urlencoded
app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

let usersDb = {}; // Database pengguna
let exerciseDb = {}; // Database latihan

// Membuat pengguna baru
app.post('/api/users', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username harus diisi' });
  }

  const _id = uuidv4();
  usersDb[_id] = username;

  res.json({ username, _id });
});

// Mendapatkan daftar semua pengguna
app.get('/api/users', (req, res) => {
  const users = Object.entries(usersDb).map(([id, username]) => ({
    _id: id,
    username,
  }));
  res.json(users);
});

// Menambahkan latihan ke pengguna
app.post('/api/users/:_id/exercises', (req, res) => {
  const _id = req.params._id;
  const { description, duration, date } = req.body;

  // Validasi ID pengguna
  if (!usersDb[_id]) {
    return res.status(404).json({ error: 'User dengan _id tersebut tidak ditemukan' });
  }

  // Validasi input wajib
  if (!description || !duration) {
    return res.status(400).json({ error: 'Isi semua kolom wajib (description dan duration)' });
  }

  const parsedDuration = parseInt(duration, 10);
  if (isNaN(parsedDuration)) {
    return res.status(400).json({ error: 'Duration harus berupa angka' });
  }

  // Jika tidak ada tanggal, gunakan tanggal saat ini
  const exerciseDate = date ? new Date(date) : new Date();
  if (isNaN(exerciseDate.getTime())) {
    return res.status(400).json({ error: 'Format tanggal tidak valid' });
  }

  // Format tanggal menjadi string `dateString`
  const formattedDate = exerciseDate.toDateString();

  // Inisialisasi database latihan jika belum ada
  if (!exerciseDb[_id]) {
    exerciseDb[_id] = [];
  }

  // Tambahkan latihan ke log pengguna
  exerciseDb[_id].push({
    description,
    duration: parsedDuration,
    date: formattedDate,
  });

  // Kirimkan respons dengan detail pengguna dan latihan yang ditambahkan
  res.json({
    _id,
    username: usersDb[_id],
    description,
    duration: parsedDuration,
    date: formattedDate,
  });
});


// Mendapatkan log latihan pengguna
app.get('/api/users/:_id/logs', (req, res) => {
  const _id = req.params._id;

  if (!usersDb[_id]) {
    return res.status(404).json({ error: 'User dengan _id tersebut tidak ditemukan' });
  }

  let logs = exerciseDb[_id] || [];
  const { from, to, limit } = req.query;

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate.getTime())) {
      logs = logs.filter(log => new Date(log.date) >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate.getTime())) {
      logs = logs.filter(log => new Date(log.date) <= toDate);
    }
  }

  if (limit) {
    const parsedLimit = parseInt(limit, 10);
    if (!isNaN(parsedLimit)) {
      logs = logs.slice(0, parsedLimit);
    }
  }

  res.json({
    _id,
    username: usersDb[_id],
    count: logs.length,
    log: logs,
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
