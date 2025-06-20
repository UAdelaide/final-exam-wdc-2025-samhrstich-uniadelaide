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
                INSERT INTO WalkRequests (dog_id, requested_time, duration_minutes, location, status) VALUES
                ((SELECT dog_id FROM Dogs WHERE name = 'Max'), '2025-06-10 08:00:00', 30, 'Parklands', 'open'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Bella'), '2025-06-10 09:30:00', 45, 'Beachside Ave', 'accepted'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Bailey'), '2025-07-15 10:45:00', 25, 'Everest', 'accepted'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Rufus'), '2025-04-15 12:30:00', 30, 'Hindley Street', 'open'),
                ((SELECT dog_id FROM Dogs WHERE name = 'Flop'), '2025-09-14 11:25:00', 35, 'Stamford Bridge', 'accepted');
            `);
            await db.execute()(`
                INSERT INTO WalkApplications (request_id, walker_id, status) VALUES
                (2, (SELECT user_id FROM Users WHERE username = 'bobwalker'), 'accepted),
                (3, (SELECT user_id FROM Users WHERE username = 'bobwalker'), 'accepted')
            `)

            await db.execute(`
                UPDATE WalkRequests
                SET  status= 'completed'
                WHERE requests_id IN (2, 3)
            `);
            await db.execute(`
                INSERT INTO WalkRatings (request_id, walker_id, owner_id, rating, comments) VALUES
                (2, (SELECT user_id FROM Users WHERE username = 'bobwalker'),
                (SELECT user_id FROM Users WHERE username = 'carol123'), 5, 'Lovely Guy!'),
                (3, (SELECT user_if FROM Users WHERE username = 'bobwalker'),
                (SELECT user_iD FROM Users WHERE username = 'benjamin'), 1, 'Kicked my dog')
            `)

            console.log('Dummy Data in database');
        }

    } catch (err) {
        console.log('Error With database', err);
    }
})();


app.get('/api/dogs', async (req, res) => {
    try {
        const query = `
        SELECT
            d.name as dog_name,
            d.size,
            u.username as owner_username
        FROM Dogs d
        JOIN Users u ON d.owner_id = u.user_id
        ORDER BY d.name
    `;

    const [rows]= await db.execute(query);
    res.join(rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({
            error: 'Failed to Retrieve dogs',
            message: error.message
        });
    }
});

app.get('/api/walkrequests/open', async (req, res) => {
    try {
        const query = `
        SELECT
            wr.request_id,
            d.name as d_name,
            wr.requested_time,
            wr.duration_minutes,
            wr.location,
            u.username as owner_username
        FROM WalkRequests wr
        JOIN Dogs d ON wr.dog_id = d.dog_id
        JOIN Users u ON d.owner_id = u.user_id
        WHERE wr.status ='open'
        ORDER BY wr.requested_time
    `;

    const [rows] =await db.execute(query);
    res.join[rows];
    } catch (error) {
        console.log('Error grabbing the walkrequests', error);
        res.status(500).json({
            error: 'Failed to reteieve walk requests',
            message: error.message
        });
    }
});

app.use('/', indexRouter);
app.use('/users', usersRouter);

module.exports = app;
