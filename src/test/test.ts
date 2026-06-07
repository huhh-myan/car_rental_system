import { Client } from "pg"



const client = await new Client({
    user:"postgres",
    password: "mysecretpassword",
    host: "localhost",
    port: 5432,
    database:"postgres"
});

await client.connect();

console.log(await client.query(`INSERT INTO users(username, password) VALUES ('test1', 'password1');`));

console.log(await client.query(`INSERT INTO bookings(user_id, car_name, days, rent_per_day, status) VALUES(1, 'testPORSCHE', 37, 7300, 'booked');`))

console.log('----------------------------------------------------------------------------------')


console.log(await client.query(`SELECT * FROM users;`));

console.log(await client.query(`SELECT * FROM bookings;`));

await client.end();
