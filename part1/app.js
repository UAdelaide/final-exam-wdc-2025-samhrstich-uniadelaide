var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var mysql = require('mysql2/promise');


var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

let db;

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: ''
        });
        await connection.query("CREATE DATABASE IF NOT EXISTS DogWalkService");
        await connection.end();

        db = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '',
            database: 'DogWalkService'
        });

        const [userRows] = await db.execute('SELECT COUNT(*) AS count FROM Users');
        if (userRows[0].count === 0) {
            console.log('Adding dummydata');

            await db.execute(`
                INSERT INTO Users (username, email, password_hash, role) VALUES
                ('alice123', 'alice@example.com', 'hashed123', 'owner'),
                ('bobwalker', 'bob@example.com', 'hashed456', 'walker'),
                ('carol123', 'carol@example.com', 'hashed789', 'owner'),
                ('benjamin', 'benjamin@example.com', 'hashed868', 'owner'),
                ('liam', 'liam@example.com', 'hashed687', 'owner'),
                ('colepalmer', 'cole@example.com', 'hashed345', 'owner')
            `);

            await db.execute(`
                INSERT INTO Dogs (owner_id, name, size) VALUES
                ((SELECT user_id FROM Users WHERE username = 'alice123'), 'Max', 'medium'),
                ((SELECT user_id FROM Users WHERE username = 'carol123'), 'Bella', 'small'),
                ((SELECT user_id FROM Users WHERE username = 'benjamin'), 'Bailey', 'medium'),
                ((SELECT user_id FROM Users WHERE username = 'liam'), 'Rufus', 'small'),
                ((SELECT user_id FROM Users WHERE username = 'colepalmer'), 'Flop', 'medium')
            `);

            await db.execute(`
                INSERT INTO `)

        }
    }
})

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
