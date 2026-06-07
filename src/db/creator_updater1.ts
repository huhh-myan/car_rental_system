import { Client } from "pg";



const client = new Client({
    user: "postgres",
    password: "mysecretpassword",
    host: "localhost",
    port: 5432,
    database: "postgres"
})

await client.connect()

console.log('UPDATING SCHEMA days < 365 in booking table--------', await client.query('ALTER TABLE bookings ADD CONSTRAINT chk_days CHECK (days < 365);'))