import { Request } from "express";
import { IBaseUser } from "./global";

export interface ICustomRequest extends Request {
  user: IBaseUser;
}
