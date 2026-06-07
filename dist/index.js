import express from "express";
import { pool } from "./db/client.js";
const app = express();
const port = 3000;
app.use(express.json());
app.get('/', async (req, res) => {
    const result = await pool.query(`SELECT * from users;`);
    res.send(result.rows);
});
// every time a error in signup, it automatically skips one id, what if i dont want it to skip
// well it should be uuid ideally ig
//hashing remains
app.post('/auth/signup', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    //safe parsing of data
    //sending password to server protected? do i need client sided encryption for that or just https is fine?
    //password hashing using bcrypt
    //then assigning them to queries using text, values
    try {
        const result = await pool.query(`INSERT INTO users(username, password) VALUES($1, $2) RETURNING id`, [username, password]);
        //console.log(result);
        res.status(201).json({
            success: true,
            data: {
                "message": "User created successfully",
                "userId": result.rows[0].id
            }
        });
    }
    catch (e) {
        //console.log(e);
        if (e.code === '23505') {
            res.status(409).json({
                success: false,
                message: 'username already exists'
            });
        }
        else {
            res.status(400).json({
                success: false,
                message: 'invalid inputs'
            });
        }
    }
    // res.send('hello there');
});
app.post('/auth/signin', async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    try {
        const result = await pool.query(`SELECT * from users WHERE username=$1`, [username]);
        // console.log(result);
        // if(!result.rowCount){
        //     throw new Error('401')
        // }
        //user existance check
        if (!result.rowCount) {
            return res.status(401).json({
                success: false,
                message: 'User does not exist'
            });
        }
        if (result.rows[0]?.password === password) {
            res.status(200).json({
                success: true,
                data: {
                    message: "Login Successful",
                    token: "ajfhdnagGHesgnasghFALSETOKEN"
                }
            });
        }
        else {
            res.status(401).json({
                success: false,
                message: "incorrect password"
            });
        }
        // console.log(rows);
        // res.json(rows);
    }
    catch (e) {
        // console.log(e);
        res.status(400).json({
            success: false,
            message: 'Invalid Inputs'
        });
    }
});
app.post('/bookings', async (req, res) => {
});
app.get('/bookings', async (req, res) => {
});
app.put('/bookings/:bookingId', async (req, res) => {
});
app.delete('/booking/:bookingId', async (req, res) => {
});
app.listen(port, () => {
    console.log(`Express app listening on port:${port}`);
});
//# sourceMappingURL=index.js.map