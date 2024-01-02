import { getSiegeSiret } from "$lib/resources/associations/association.helper";
import Store from "$lib/core/Store";
import associationService from "$lib/resources/associations/association.service";
import establishmentService from "$lib/resources/establishments/establishment.service";
import { waitElementIsVisible } from "$lib/helpers/visibilityHelper";

const resourceNameWithDemonstrativeByType = {
    association: "cette association",
    establishment: "cet établissement",
};

export class DocumentsController {
    constructor(resourceType, resource) {
        this.resourceType = resourceType;
        this.element = new Store(null);
        this.documentsPromise = new Store(new Promise(() => null));
        this.resource = resource;
    }

    get resourceNameWithDemonstrative() {
        return resourceNameWithDemonstrativeByType[this.resourceType];
    }

    get getterByType() {
        return {
            establishment: this.getEstablishmentDocuments,
            association: this.getAssociationDocuments,
        };
    }

    async getAssociationDocuments(association) {
        const associationDocuments = await associationService.getDocuments(association.rna || association.siren);
        return associationDocuments.filter(
            doc => !doc.__meta__.siret || doc.__meta__.siret === getSiegeSiret(association),
        );
    }

    getEstablishmentDocuments(establishment) {
        return establishmentService.getDocuments(establishment.siret);
    }

    async onMount() {
        await waitElementIsVisible(this.element);
        const promise = this.getterByType[this.resourceType](this.resource);
        this.documentsPromise.set(promise);
    }
}
