import { Pool } from "pg";

export const pool = new Pool({
    user:"postgres",
    password: "mysecretpassword",
    host: "localhost",
    port: 5432,
    database:"postgres"
});

// await client.connect();


// export a wrapper of query not client or pool because then you can check duration of each query by changing the fucntion

// const query = (text: string, params: (string|number )[]) => {
//     return pool.query(text, params);
// }