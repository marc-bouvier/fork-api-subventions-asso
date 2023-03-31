import { ApplicationStatus } from "@api-subventions-asso/dto";
import { valueOrHyphen, numberToEuro } from "@helpers/dataHelper";
import { capitalizeFirstLetter } from "@helpers/textHelper";

export default class SubventionsAdapter {
    static toSubvention(subvention) {
        let dispositif = subvention.dispositif;
        let serviceInstructeur = subvention.service_instructeur;
        let projectName = this._getProjectName(subvention);

        return {
            serviceInstructeur: valueOrHyphen(serviceInstructeur),
            dispositif: valueOrHyphen(dispositif),
            projectName: valueOrHyphen(projectName),
            montantsDemande: valueOrHyphen(numberToEuro(subvention.montants?.demande)),
            montantsAccorde: numberToEuro(subvention.montants?.accorde),
            status: subvention.statut_label,
        };
    }

    static _getProjectName(subvention) {
        if (!subvention.actions_proposee || !subvention.actions_proposee.length) return;

        let names = subvention.actions_proposee
            .sort((actionA, actionB) => actionA.rang - actionB.rang)
            .map(action => `${capitalizeFirstLetter(action.intitule)}.`.replace("..", "."));

        names = [...new Set(names)].join(" - ");

        return names;
    }
}