import { SignupErrorCodes, ResetPasswordErrorCodes } from "@api-subventions-asso/dto";
import authPort from "@resources/auth/auth.port";

export class AuthService {
    signup(email) {
        if (!email) return Promise.reject(SignupErrorCodes.EMAIL_NOT_VALID);
        return authPort
            .signup(email)
            .then(data => data)
            .catch(error => Promise.reject(parseInt(error.message)));
    }

    resetPassword(token, password) {
        if (!token) return Promise.reject(ResetPasswordErrorCodes.INTERNAL_ERROR);
        return authPort
            .resetPassword(token, password)
            .then(data => data)
            .catch(error => Promise.reject(parseInt(error.message)));
    }
}

const authService = new AuthService();

export default authService;