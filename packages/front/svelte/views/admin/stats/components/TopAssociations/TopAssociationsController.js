import Store from "@core/Store";
import statsService from "@resources/stats/stats.service";
import { getOneYearBeforeDate } from "@helpers/dateHelper";

export default class TopAssociationsController {
    constructor(limit = 5) {
        this.topAssociations = new Store([]);

        this._startDate = getOneYearBeforeDate(new Date());
        this._limit = limit;

        this.startDateYear = this._startDate.getFullYear();
        this.startDateMonth = this._startDate.toLocaleString("default", { month: "short" });
    }

    async init() {
        await this._updateTopAssociations();
    }

    async _updateTopAssociations() {
        const topAssociations = await statsService.getTopAssociations(this._limit);
        this.topAssociations.set(topAssociations);
    }
}