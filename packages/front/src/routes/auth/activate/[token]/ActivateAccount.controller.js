import { ResetPasswordErrorCodes, TokenValidationType } from "dto";
import StructureStep from "./components/StructureStep/StructureStep.svelte";
import AgentTypeStep from "./components/AgentTypeStep/AgentTypeStep.svelte";
import CollectedDataAlert from "./components/AgentTypeStep/CollectedDataAlert.svelte";
import DefinePassword from "$lib/components/DefinePassword/DefinePassword.svelte";
import PasswordFormatAlert from "$lib/components/DefinePassword/PasswordFormatAlert.svelte";
import authService from "$lib/resources/auth/auth.service";
import { goToUrl } from "$lib/services/router.service";
import Store from "$lib/core/Store";

export default class ActivateAccountController {
    constructor(token) {
        this.token = token;
        this.validationTokenStore = new Store("waiting");
        this.error = null;
        this.steps = [
            { name: "Définir un mot de passe", component: DefinePassword, alert: PasswordFormatAlert },
            { name: "Informations sur votre profil", component: AgentTypeStep, alert: CollectedDataAlert },
            { name: "Informations sur votre structure", component: StructureStep },
        ];
        this.buildContext = values => ({ agentType: values[1].agentType });
    }

    async onSubmit(values) {
        await authService.resetPassword(this.token, values.password);
        goToUrl("/auth/login?success=ACCOUNT_ACTIVATED");
    }

    async init() {
        await this._checkTokenValidity();
    }

    async _checkTokenValidity() {
        const tokenValidation = await authService.validateToken(this.token);
        if (!tokenValidation.valid) {
            this.error = { data: { code: ResetPasswordErrorCodes.RESET_TOKEN_NOT_FOUND } };
            this.validationTokenStore.set("invalid");
        } else {
            if (tokenValidation.type === TokenValidationType.FORGET_PASSWORD) {
                goToUrl(`/auth/reset-password/${this.token}`);
            } else {
                this.validationTokenStore.set("valid");
            }
        }
    }
}