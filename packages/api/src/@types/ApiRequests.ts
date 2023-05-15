import { Request } from "express";
import { UserWithJWTDto, UserDto } from "@api-subventions-asso/dto/user/UserDto";
import { IVerifyOptions } from "passport-local";

export interface IdentifiedRequest extends Request {
    user: UserDto;
    authInfo: IVerifyOptions;
}

export interface LoginRequest extends Request {
    user?: UserWithJWTDto;
    authInfo: IVerifyOptions;
}
