import { valueOrHyphen, numberToEuro } from "@helpers/dataHelper";
import { withTwoDigitYear } from "@helpers/dateHelper";
import { getLastVersementsDate } from "@components/SubventionsVersementsDashboard/helper";

export default class VersementsAdapter {
    static toVersement(versements) {
        return {
            totalAmount: valueOrHyphen(this._getTotalPayment(versements)),
            centreFinancier: valueOrHyphen(versements[0]?.centreFinancier),
            lastVersementDate: valueOrHyphen(withTwoDigitYear(getLastVersementsDate(versements)))
        };
    }

    static _getTotalPayment(versements) {
        if (!versements || !versements.length) return undefined;

        return numberToEuro(this._countTotalVersement(versements));
    }

    static _countTotalVersement(versements) {
        return versements.reduce((acc, versement) => acc + versement.amount, 0);
    }
}
