import express from "express";
import { pool } from "./db/client.js";
import { JWT_SECRET, middleware } from "./middleware.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const app = express();
const port = 3000;
const saltRounds = 10;


app.use(express.json());

app.get('/', async (req, res)=>{
    const result = await pool.query(`SELECT * FROM users;`);

    res.send(result.rows);
})
// every time a error in signup, it automatically skips one id, what if i dont want it to skip
// well it should be uuid ideally ig

//hashing remains- done
app.post('/auth/signup', async (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    //safe parsing of data

    //sending password to server protected? do i need client sided encryption for that or just https is fine?
    //password hashing using bcrypt
    //then assigning them to queries using text, values

    try{
        const result = await pool.query(`INSERT INTO users(username, password) VALUES($1, $2) RETURNING id;`, [username, hashedPassword]);
        
        //console.log(result);
        res.status(201).json({
            success: true,
            data: {
                "message": "User created successfully",
                "userId": result.rows[0].id
            }
        });

    }catch(e){
        //console.log(e);
        if((e as any).code  === '23505'){
            res.status(409).json({
                success: false,
                message: 'username already exists'
            })
        }else{
            res.status(400).json({
                success: false,
                message: 'invalid inputs'
            })
        }

    }


    // res.send('hello there');
})
//hashing of password, and making jwt and assigning it to auth header
app.post('/auth/signin', async (req, res)=>{
    const username = req.body.username;
    const password = req.body.password;


    
    try{
        const result   = await pool.query(`SELECT * from users WHERE username=$1;`, [username]);

        // console.log(result);
        // if(!result.rowCount){
        //     throw new Error('401')
        // }
        //user existance check
        if(!result.rowCount){
            return res.status(401).json({
                success: false,
                message: 'User does not exist'
            })
        }

        const hashedpasswordCheck = await bcrypt.compare(password, result.rows[0].password)

        if (hashedpasswordCheck){

            const token = await jwt.sign({userId: result.rows[0].id, username: result.rows[0].username },JWT_SECRET);

            req.headers.authorization = `Bearer ${token}`;

            res.status(200).json({
                success: true,
                data: {
                    message: "Login Successful",
                    token: token
                }
            })
        }else{
            res.status(401).json({
                success: false,
                message: "incorrect password"
            })
        }
        // console.log(rows);
        // res.json(rows);
    }catch(e){
        // console.log(e);
        res.status(400).json({
            success:false,
            message:'Invalid Inputs'
        });
    }



})

//extension of request type
declare global {
    namespace Express {
        export interface Request {
            user :{
                userId: number,
                username: string
            }
        }
    }
}

//days should be less than 365 add constraint to db --done
// 
app.post('/bookings', middleware, async (req, res)=>{
    const carName = req.body.carName;
    const days = req.body.days;
    const rentPerDay = req.body.rentPerDay;

    const userId = req.user.userId;

    try{
        if(days<0 || days>364){
            throw new Error('Invalid input');
        }
        const result =  await pool.query(`INSERT INTO users(user_id, car_name, days, rent_per_day, status) VALUES ($1, $2, $3, $4, $5) RETURNING id;`,[userId, carName, days, rentPerDay, "booked"])

        return res.status(201).json({
            success:true,
            data:{
                "message": "Booking created successfully",
                "bookingId": result.rows[0].id,
                "totalCost": rentPerDay*days
            }
        })
    }catch(e){
        return res.status(400).json({
            success: false,
            message: "Invalid Inputs"
        })
    }

})


app.get('/bookings', middleware, async (req, res)=>{

    const bookingId = req.query?.bookingId;
    const summary = req.query?.summary ;

    const userId  = req.user.userId

    try{
        // const result = await pool.query(`SELECT (id, car_name, days, rent_per_day, status) FROM users WHERE (id=$1,userId=$2);`, [bookingId,userId]);
        if(bookingId && !summary){
            const result = await pool.query(`SELECT (id, car_name, days, rent_per_day, status) FROM users WHERE (id=$1,userId=$2);`, [bookingId,userId]);
            return res.status(200).json({
                success: true,
                data: [
                        {
                            ...result.rows[0], 
                            "totalCost": result.rows[0].days*result.rows[0].rent_per_day
                    }
                ]
            })
        }

        if(summary){
            const result = await pool.query(`SELECT (days, rent_per_day) FROM users WHERE (userId=$1);`, [userId]);
            const totalAmountSpent = result.rows?.reduce((sum, {days, rent_per_day}) => sum + (days*rent_per_day),0)

            return res.status(200).json({
                success: true,
                data: {
                    "userId": req.user.userId,
                    "username": req.user.username,
                    "totalBooking": result.rowCount,
                    "totalAmountSpent": (totalAmountSpent ? totalAmountSpent : 0)
                }
            })
        }


    }catch(e){

        return res.status(404).json({
            success: false,
            message: "bookingId not found"
        })

    }
})


app.put('/bookings/:bookingId', middleware, async (req, res)=>{

    const bookingId = req.params.bookingId;
    const userId = req.user.userId
    let result ;

    //checking booking of user or not
    try{
        result = await pool.query(`SELECT * FROM bookings WHERE id=$1`, [bookingId]);

        if(userId !== result.rows[0].user_id){
            return res.status(403).json({
                success: false,
                message: "booking does not belong to user"
            })
        }
    }catch(e){
        return res.status(404).json({
            success: false,
            message: "booking not found"
        })
    }

    //status can be changed to cancelled or completed; then also case arises cannot edit booking if status is cancelled or completed 
    const status = req.body?.status;

    const carName = req.body?.carName;
    const days = req.body?.days;
    const rentPerDay = req.body?.rentPerDay;

    try{
        
        if(status){
            result = await pool.query(`UPDATE bookings SET status=$1 WHERE user_id=$2 AND id=$3 RETURNING (id, car_name, days, rent_per_day, status);`, ['completed', userId, bookingId]);
        }else{
            result = await pool.query(`UPDATE bookings SET car_name=$1, days=$2, rent_per_day=$3 WHERE user_id=$4 AND id=$5 RETURNING (id, car_name, days, rent_per_day, status);`, [carName, days, rentPerDay, userId, bookingId]);
        }   
        return res.status(200).json({
            success: true,
            data: {
                "message": "Booking updated successfully",
                "booking": {
                    ...result.rows[0],
                    "totalCost": result.rows[0].days*result.rows[0].rent_per_day
                }
            }
        })
    }catch(e){
        return res.status(400).json({
            success: false,
            message: "Invalid Inputs"
        })
    }
})


app.delete('/booking/:bookingId', middleware, async (req, res)=>{
    const bookingId = req.params.bookingId;
    const userId = req.user.userId;

    try{
        const result = await pool.query(`SELECT * from bookings WHERE id=$1;`, [bookingId]);

        if(userId !== result.rows[0].user_id){
            return res.status(403).json({
                successs: false,
                message: "booking does not belong to user"
            })
        }

    }catch(e){
        return res.status(404).json({
            success: false,
            message: "booking not found"
        })
    }
})


app.listen(port,()=>{
    console.log(`Express app listening on port:${port}`);
})
