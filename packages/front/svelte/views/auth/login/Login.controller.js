import authService from "@resources/auth/auth.service";
import Store from "@core/Store";
import { LoginDtoErrorCodes } from "@api-subventions-asso/dto";
import { goToUrl } from "@services/router.service";

export default class LoginController {
    constructor(query) {
        this._query = query;
        this.formElt = null;
        this.error = new Store(null);
        this.showSuccessMessage = !!query.success;
        this.successMessage = this._getSuccessMessage();
    }

    async submit(e) {
        e.preventDefault();
        if (!this.formElt) return;
        const { email, password } = Object.fromEntries(new FormData(this.formElt).entries());

        try {
            await authService.login(email, password);
            goToUrl("/");
        } catch (e) {
            const message = this._getErrorMessage(e.data?.code);

            this.error.set(message);
        }
    }

    _getErrorMessage(code) {
        if (code === LoginDtoErrorCodes.EMAIL_OR_PASSWORD_NOT_MATCH) {
            return "Mot de passe ou email incorrect";
        }

        if (code === LoginDtoErrorCodes.USER_NOT_ACTIVE) {
            return "Votre compte ne semble pas encore activé, si vous ne retrouvez pas votre mail d'activation vous pouvez faire mot de passe oublié.";
        }

        return "Une erreur interne est survenue, veuillez réessayer plus tard.";
    }

    _getSuccessMessage() {
        return this._query.success === "COMPTE_ACTIVED"
            ? "Votre compte a bien été activé, vous pouvez maintenant vous connecter"
            : "Votre mot de passe a bien été changé";
    }
}