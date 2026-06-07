import type { NextFunction, Request, Response } from "express";
import jwt, { type JwtPayload } from "jsonwebtoken";

const JWT_SECRET = "wow";


export const middleware = (req: Request, res: Response, next: NextFunction) => {
    const bearertoken = req.headers?.authorization;
    if(!bearertoken){
        return res.status(401).json({
            success: false,
            message: "Authorization header missing"
        })
    }

    const token = bearertoken?.split(" ")[1]
    if(!token){
        return res.status(401).json({
            success: false,
            message: "Token missing after Bearer"
        })
    }

    const result = jwt.verify(token, JWT_SECRET) as unknown as JwtPayload;
    if(!result){
        return res.status(401).json({
            success: false,
            message : "Token Invalid"
        })
    }

    req.user.userId = result.userId;
    req.user.username = result.username;

    next();
}