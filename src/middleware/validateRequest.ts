import { NextFunction, Response } from "express";
import z from "zod";



  export const validateRequest = (schema: z.ZodType<any>) => (req:any, res:Response, next:NextFunction) => {
  try {
    const result = schema.parse({
      ...req.body,
      ...req.params,
      ...req.query,
    });
    req.validated = result; 
    next();
  } catch (err: any) {
    return res.status(400).json({
      success: false,
      errors: err.errors || err.message,
    });
  }
};