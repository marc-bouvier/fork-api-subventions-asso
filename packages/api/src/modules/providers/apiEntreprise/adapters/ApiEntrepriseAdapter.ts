import { Etablissement } from "@api-subventions-asso/dto";
import { siretToNIC } from "../../../../shared/helpers/SirenHelper";
import ProviderValueFactory from "../../../../shared/ProviderValueFactory";
import IApiEntrepriseHeadcount from "../@types/IApiEntrepriseHeadcount";

export default class  ApiEntrepriseAdapter {
    static PROVIDER_NAME = "API Entreprise"
    static toEtablissement(data: IApiEntrepriseHeadcount): Etablissement {
        const toProviderValue = ProviderValueFactory.buildProviderValuesAdapter(this.PROVIDER_NAME, new Date(parseInt(data.annee, 10), parseInt(data.mois, 10)));
        return {
            siret: toProviderValue(data.siret),
            nic: toProviderValue(siretToNIC(data.siret)),
            headcount: toProviderValue(data.effectifs_mensuels)
        }
    }
}