const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./models/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));


app.use(session({
    secret: 'secretkey1234',
    resave: false,
    saveUninitialized: false,
    cookie: {secure: true}
}));


app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const [rows] = await db.execute(
            'SELECT user_id, username, email, password_hash, role FROM Users WHERE username =?',
            [username]
        );
        if (rows.length ===0) {
            return res.redirect('/?error=Invalid Username or Password');
        }
        const user = rows[0];

        if (user.password_hash !== password ) {
            return res.redirect('/?error=Inavalid Username or password');
        }

        req.session.user_Id = user.user_id;
        req.session.username = user.username;
        req.session.role = user.role;

        if (user.role === 'owner') {
            res.redirect('/owner-dashboard.html');

        } else if (user.role === 'walker') {
            res.redirect('/walker-dashboard')
        }
    }
})

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');


app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);

// Export the app instead of listening here
module.exports = app;