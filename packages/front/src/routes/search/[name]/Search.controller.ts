import { goto } from "$app/navigation";
import Store from "$lib/core/Store";
import { returnInfinitPromise } from "$lib/helpers/promiseHelper";
import { decodeQuerySearch, encodeQuerySearch } from "$lib/helpers/urlHelper";
import { isRna, isSiren, isSiret } from "$lib/helpers/validatorHelper";
import associationService from "$lib/resources/associations/association.service";

export default class SearchController {
    associations: Store<any>;
    searchPromise: Store<Promise<any>>;
    inputSearch: Store<string>;

    constructor(name) {
        this.inputSearch = new Store(decodeQuerySearch(name));
        this.associations = new Store([]);
        this.searchPromise = new Store(returnInfinitPromise());
        this.searchPromise.set(this.fetchAssociationFromName(name));
    }

    fetchAssociationFromName(name) {
        return associationService.search(name).then(associations => this.associations.set(associations));
    }

    updateNbEtabsLabel() {
        const nbAssos = this.associations.value.length;
        return nbAssos > 1 ? `${nbAssos} résultats trouvés.` : `${nbAssos} résultat trouvé.`;
    }

    onSubmit() {
        if (isRna(this.inputSearch.value) || isSiren(this.inputSearch.value)) {
            goto(`/association/${this.inputSearch.value}`);
        } else if (isSiret(this.inputSearch.value)) {
            goto(`/etablissement/${this.inputSearch.value}`);
        } else {
            const encodedValue = encodeQuerySearch(this.inputSearch.value);
            this.searchPromise.set(this.fetchAssociationFromName(encodedValue));
            return goto(`/search/${encodedValue}`, { replaceState: true });
        }
    }
}
