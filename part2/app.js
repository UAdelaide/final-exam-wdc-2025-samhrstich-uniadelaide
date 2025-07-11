const express = require('express');
const session = require('express-session');
const path = require('path');
// setting up a connection to the database
const db = require('./models/db');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '/public')));


// using the express session middleware to create a session for each user
app.use(session({
    //random secret string
    secret: 'secretkey1234',
    resave: false,
    saveUninitialized: false,
    cookie: {secure: true}
}));

// this route will handle all the login requests sending the credidentials to create a session
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
// if the password and the password entered do not much then return an error
        if (user.password_hash !== password ) {
            return res.redirect('/?error=Inavalid Username or password');
        }
        //storing the users info in the session
        req.session.user_Id = user.user_id;
        req.session.username = user.username;
        req.session.role = user.role;

        if (user.role === 'owner') {
            res.redirect('/owner-dashboard.html');

        } else if (user.role === 'walker') {
            res.redirect('/walker-dashboard.html');
        } else {
            res.redirect('/?error=Invalid role');
        }
    } catch (error) {
        console.error('Login error',error);
        res.redirect('/?error=ServerError');
    }
});
// handles the logout and deletes the current session redirecting to the login page.
app.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout erro:', err);
        }
        res.redirect('/');
    });
});
// checks whether a user is logged in.
const requireAuth = (req, res, next) => {
    if (req.session.user_Id) {
        next();
    } else {
        res.redirect('/?error=Please log in')
    }
};

// Routes
const walkRoutes = require('./routes/walkRoutes');
const userRoutes = require('./routes/userRoutes');


app.use('/api/walks', walkRoutes);
app.use('/api/users', userRoutes);
app.use('/api/users', requireAuth, userRoutes);

// Export the app instead of listening here
module.exports = app;