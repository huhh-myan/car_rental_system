import { Client } from "pg";
const client = new Client({
    user: "postgres",
    password: "mysecretpassword",
    host: "localhost",
    port: 5432,
    database: "postgres"
});
await client.connect();
console.log(await client.query(`DROP TABLE IF EXISTS bookings;`));
console.log(await client.query(`DROP TABLE IF EXISTS users;`));
console.log('CREATING USERS TABLE------', await client.query(`CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    username varchar(255) NOT NULL UNIQUE,
    password varchar(255) NOT NULL,
    created_at timestamp DEFAULT now()
    );`));
console.log('CREATING BOOKINGS TABLE------', await client.query(`CREATE TABLE bookings(
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES users(id) NOT NULL,
    car_name VARCHAR(50) NOT NULL,
    days INT NOT NULL,
    rent_per_day INT NOT NULL,
    status TEXT NOT NULL CONSTRAINT check_booking_status CHECK (LOWER(status) IN ('booked', 'cancelled', 'completed')),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`));
await client.end();
//# sourceMappingURL=creator.js.map