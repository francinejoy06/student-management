require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const app = express();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect((err) => {
  if (err) {
    console.error('Database connection failed:', err);
    return;
  }
  console.log('Connected to MySQL');
});

// Activity 8: configure Express
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Activity 9: student list
app.get('/', (req, res) => {
  db.query('SELECT * FROM students ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Database error');
    }
    res.render('index', { students: results });
  });
});

// Activity 12: add student form
app.get('/students/add', (req, res) => {
  res.render('add');
});

app.post('/students/add', (req, res) => {
  let { student_id, first_name, last_name, course, year_level, email } = req.body;

  student_id = (student_id || '').trim();
  first_name = (first_name || '').trim();
  last_name = (last_name || '').trim();
  course = (course || '').trim();
  email = (email || '').trim();
  const year = Number(year_level);

  if (!student_id || !first_name || !last_name || !course || !year_level || !email) {
    return res.status(400).send('All fields are required');
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).send('Invalid email');
  }
  if (!Number.isInteger(year) || year < 1 || year > 5) {
    return res.status(400).send('Year level must be 1 to 5');
  }

  const sql = `
    INSERT INTO students
    (student_id, first_name, last_name, course, year_level, email)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(sql, [student_id, first_name, last_name, course, year, email], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).send('Student ID already exists');
      }
      console.error(err);
      return res.status(500).send('Unable to save student');
    }
    res.redirect('/');
  });
});
app.get('/students/search', (req, res) => {
  const keyword = req.query.keyword || '';

  const sql = `
    SELECT * FROM students
    WHERE student_id LIKE ?
    OR first_name LIKE ?
    OR last_name LIKE ?
    OR course LIKE ?
  `;

  const searchValue = `%${keyword}%`;

  db.query(sql, [searchValue, searchValue, searchValue, searchValue], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Search error');
    }
    res.render('index', { students: results });
  });
});

    
app.post('/students/delete/:id', (req, res) => {
  db.query('DELETE FROM students WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Unable to delete student');
    }
    res.redirect('/');
  });
});

// Ipakita ang edit form
app.get('/students/edit/:id', (req, res) => {
  db.query('SELECT * FROM students WHERE id = ?', [req.params.id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).send('Student not found');
    }
    res.render('edit', { student: results[0] });
  });
});

app.post('/students/edit/:id', (req, res) => {
  let { student_id, first_name, last_name, course, year_level, email } = req.body;

  student_id = (student_id || '').trim();
  first_name = (first_name || '').trim();
  last_name = (last_name || '').trim();
  course = (course || '').trim();
  email = (email || '').trim();
  const year = Number(year_level);

  if (!student_id || !first_name || !last_name || !course || !year_level || !email) {
    return res.status(400).send('All fields are required');
  }
  if (!email.includes('@') || !email.includes('.')) {
    return res.status(400).send('Invalid email');
  }
  if (!Number.isInteger(year) || year < 1 || year > 5) {
    return res.status(400).send('Year level must be 1 to 5');
  }

  const sql = `
    UPDATE students
    SET student_id = ?, first_name = ?, last_name = ?, course = ?, year_level = ?, email = ?
    WHERE id = ?
  `;

  db.query(sql, [student_id, first_name, last_name, course, year, email, req.params.id], (err) => {
    if (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(400).send('Student ID already exists');
      }
      console.error(err);
      return res.status(500).send('Unable to update student');
    }
    res.redirect('/');
  });
});
app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});