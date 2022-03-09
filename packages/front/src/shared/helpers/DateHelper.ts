import { ProviderValues } from "@api-subventions-asso/dto";
import ProviderValueHelper from "./ProviderValueHelper";

export default class DateHelper {
    public static formatDate(data: ProviderValues) {
        const value = ProviderValueHelper.getValue(data) as string;
        if (!value) return 
        
        const date = new Date(value);

        const doubleNumber = (num: number) => ("0" + num).slice(-2)

        return `${doubleNumber(date.getDate())}/${(doubleNumber(date.getMonth() + 1))}/${date.getFullYear()}`.replace("  ", " ");
    }
}