import { Rna, Siren, Siret } from "dto";
import { getSiegeSiret } from "$lib/resources/associations/association.helper";
import { valueOrHyphen } from "$lib/helpers/dataHelper";
import AssociationEntity from "$lib/resources/associations/entities/AssociationEntity";

export class StructureTitleController {
    public title?: string;
    public subtitle?: string;
    public linkToAsso?: string;
    public rna: Rna | "-";
    public siren: Siren | "-";
    public rup: boolean;
    public nbEstabs: number;

    constructor(association: AssociationEntity, siret: Siret | undefined = undefined) {
        const associationName = association.denomination_rna || association.denomination_siren;
        if (siret) {
            this.title =
                getSiegeSiret(association) === siret
                    ? "Établissement siège de l'association"
                    : "Établissement secondaire de l'association";
            this.subtitle = associationName;
            this.linkToAsso = `/association/${association.siren}`;
        } else this.title = `Association : ${associationName}`;
        this.rna = valueOrHyphen(association.rna);
        this.siren = valueOrHyphen(association.siren);
        this.rup = Boolean(association.rup);
        this.nbEstabs = association.etablisements_siret ? association.etablisements_siret.length : 1;
    }

    get hasActionButton() {
        return !!this.subtitle;
    }

    get nbEstabLabel() {
        // duplicate from AssociationCard but I don't think it is worth making an helper for this
        return this.nbEstabs <= 1
            ? `${this.nbEstabs} établissement rattaché`
            : `${this.nbEstabs} établissements rattachés`;
    }
}