const express = require('express');
const app = express();
const port = 3000;
const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const publicDir = path.join(__dirname, './public');
const bcrypt = require('bcryptjs');

//idk what this urlendcoded does exactly
app.use(express.urlencoded({ extended: 'false' }));
app.use(express.json());

app.use(express.static(publicDir));
app.set('view engine', 'ejs');

dotenv.config({ path: './.env' });

const db = new Pool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE,
  port: process.env.DATABASE_PORT
});

db.connect((error) => {
  if (error) {
    console.log('Error connecting to PostgreSQL:', error);
  } else {
    console.log('PostgreSQL connected!');
  }
});

app.get('/', (req, res) => {
  res.render("index");
});

app.get('/register', (req, res) => {
  res.render("register");
});

app.get('/login', (req, res) => {
  res.render("login", { message: "" });
});

// -----------------------------------------------------
app.post('/auth/register', async (req, res) => {
  const { name, email, password, password_confirm } = req.body;

  try {
    const emailCheck = await db.query('SELECT email FROM users WHERE email = $1', [email]);

    if (emailCheck.rows.length > 0) {
      return res.render('register', {
        message: 'Email already in use'
      });
    }

    if (password !== password_confirm) {
      return res.render('register', {
        message: 'Passwords do not match!'
      })
    }

    let hashedPass = await bcrypt.hash(password, 8);

    await db.query('INSERT INTO users (name, email, password) VALUES ($1, $2, $3)', [name, email, hashedPass]);

    return res.render('index', {
      message: 'User registered successfully!'
    });
  } catch (error) {
    console.error('Error during registration:', error);
    return res.render('register', {
      message: 'server error'
    });
  }
});
// ----------------------------------------------------------------

// -----------------------------------------------------------------
app.post('/auth/login', async (req, res) => {
  const { name, password } = req.body;

  try {
    const userCheck = await db.query(`SELECT * FROM users WHERE name = '${name}'`)

    if (userCheck.rows.length === 0) {
      return res.render('login', {
        message: 'User not found'
      })
    }

    const hashedPassword = userCheck.rows[0].password;

    const matchedPassword = await bcrypt.compare(password, hashedPassword);

    if (!matchedPassword) {
      return res.render('login', {
        message: 'Incorrect Password'
      })
    }

    return res.render('index', {
      message: 'Login Successful'
    })

  } catch (error) {
    console.error('Error signing in:', error)
    return res.render('login', {
      message: 'server error'
    })
  }
})
// -----------------------------------------------------------------

app.listen(port, () => {
  console.log(`listening to port ${port}`);
})