import { Siret } from "dto";

export type ScdlGrant = {
    allocatorName: string;
    allocatorSiret: Siret;
    conventionDate?: Date;
    decisionReference?: string;
    associationName?: string;
    associationSiret: string;
    associationRna: string;
    object?: string;
    amount: number;
    paymentNature: string;
    paymentConditions?: string;
    paymentStartDate?: Date;
    paymentEndDate?: Date;
    idRAE?: string;
    UeNotification?: boolean;
    grantPercentage?: number;
    aidSystem: string;
};
