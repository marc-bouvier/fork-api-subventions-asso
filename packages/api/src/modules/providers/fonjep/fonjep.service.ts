import { Siret, Siren, DemandeSubvention, Etablissement, VersementFonjep } from "@api-subventions-asso/dto";
import { ProviderEnum } from '../../../@enums/ProviderEnum';
import { isAssociationName, isDates, isNumbersValid, isSiret, isStringsValid } from "../../../shared/Validators";
import DemandesSubventionsProvider from "../../subventions/@types/DemandesSubventionsProvider";
import EtablissementProvider from "../../etablissements/@types/EtablissementProvider";
import FonjepEntityAdapter from "./adapters/FonjepEntityAdapter";
import FonjepSubventionEntity from "./entities/FonjepSubventionEntity";
import fonjepRepository from "./repositories/fonjep.repository";
import fonjepVersementRepository from "./repositories/fonjep.versement.repository";
import FonjepVersementEntity from "./entities/FonjepVersementEntity";
import VersementsProvider from "../../versements/@types/VersementsProvider";

export enum FONJEP_SERVICE_ERRORS {
    INVALID_ENTITY = 1,
}

export interface RejectedRequest {
    success: false,
    message: string,
    code: FONJEP_SERVICE_ERRORS,
    data?: unknown
}

export type CreateFonjepResponse = RejectedRequest | { success: true }
export class FonjepService implements DemandesSubventionsProvider, EtablissementProvider, VersementsProvider {

    provider = {
        name: "Extranet FONJEP",
        type: ProviderEnum.raw,
        description: "L'extranet de gestion du Fonjep permet aux services instructeurs d'indiquer les décisions d'attribution des subventions Fonjep et aux associations bénéficiaires de transmettre les informations nécessaires à la mise en paiment des subventions par le Fonjep, il ne gère pas les demandes de subvention qui ne sont pas dématérialisées à ce jour."
    }

    async createSubventionEntity(entity: FonjepSubventionEntity): Promise<CreateFonjepResponse> {
        const valid = this.validateEntity(entity);

        if (!valid.success) return valid;

        await fonjepRepository.create(entity);

        return {
            success: true
        };
    }

    validateEntity(entity: FonjepSubventionEntity): { success: true } | RejectedRequest {
        if (!isSiret(entity.legalInformations.siret)) {
            return { success: false, message: `INVALID SIRET FOR ${entity.legalInformations.siret}`, data: entity, code: FONJEP_SERVICE_ERRORS.INVALID_ENTITY };
        }

        if (!isAssociationName(entity.legalInformations.name)) {
            return { success: false, message: `INVALID NAME FOR ${entity.legalInformations.siret}`, data: entity, code: FONJEP_SERVICE_ERRORS.INVALID_ENTITY };
        }

        const dates = [
            entity.indexedInformations.date_fin_triennale,
        ]

        if (!isDates(dates)) {
            return { success: false, message: `INVALID DATE FOR ${entity.legalInformations.siret}`, data: entity, code: FONJEP_SERVICE_ERRORS.INVALID_ENTITY };
        }

        const strings = [
            entity.indexedInformations.status,
            entity.indexedInformations.service_instructeur,
            entity.indexedInformations.ville,
            entity.indexedInformations.type_post,
            entity.indexedInformations.ville,
            entity.indexedInformations.code_postal,
            entity.indexedInformations.contact,
        ]

        if (!isStringsValid(strings)) {
            return { success: false, message: `INVALID STRING FOR ${entity.legalInformations.siret}`, data: entity, code: FONJEP_SERVICE_ERRORS.INVALID_ENTITY };
        }

        const numbers = [
            entity.indexedInformations.montant_paye,
            entity.indexedInformations.annee_demande
        ]

        if (!isNumbersValid(numbers)) {
            return { success: false, message: `INVALID NUMBER FOR ${entity.legalInformations.siret}`, data: entity, code: FONJEP_SERVICE_ERRORS.INVALID_ENTITY };
        }

        return { success: true };
    }

    async createVersementEntity(entity: FonjepVersementEntity): Promise<CreateFonjepResponse> {
        if (!isSiret(entity.legalInformations.siret)) {
            return { success: false, message: `INVALID SIRET FOR ${entity.legalInformations.siret}`, data: entity, code: FONJEP_SERVICE_ERRORS.INVALID_ENTITY };
        }

        // Do not validEntity now because it is only called after Subvention validation (siret as already been validated)
        await fonjepVersementRepository.create(entity);

        return {
            success: true
        };
    }


    /**
     * |----------------------------|
     * |  DemandesSubventions Part  |
     * |----------------------------|
     */

    isDemandesSubventionsProvider = true

    async getDemandeSubventionBySiret(siret: Siret): Promise<DemandeSubvention[] | null> {
        const entities = await fonjepRepository.findBySiret(siret);

        if (entities.length === 0) return null;

        return entities.map(e => FonjepEntityAdapter.toDemandeSubvention(e));
    }

    async getDemandeSubventionBySiren(siren: Siren): Promise<DemandeSubvention[] | null> {
        const entities = await fonjepRepository.findBySiren(siren);

        if (entities.length === 0) return null;

        return entities.map(e => FonjepEntityAdapter.toDemandeSubvention(e));
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async getDemandeSubventionByRna(rna: string): Promise<DemandeSubvention[] | null> {
        return null;
    }

    async getDemandeSubventionById(id: string): Promise<DemandeSubvention> {
        const entity = await fonjepRepository.findById(id);
        if (!entity) throw new Error("DemandeSubvention not found");
        return FonjepEntityAdapter.toDemandeSubvention(entity);
    }

    /**
     * |----------------------|
     * |  Etablissement Part  |
     * |----------------------|
     */

    isEtablissementProvider = true

    async getEtablissementsBySiret(siret: Siret): Promise<Etablissement[] | null> {
        const entities = await fonjepRepository.findBySiret(siret);

        if (entities.length === 0) return null;

        return entities.map(e => FonjepEntityAdapter.toEtablissement(e));
    }

    async getEtablissementsBySiren(siren: Siren): Promise<Etablissement[] | null> {
        const entities = await fonjepRepository.findBySiren(siren);

        if (entities.length === 0) return null;

        return entities.map(e => FonjepEntityAdapter.toEtablissement(e));
    }

    async dropCollection() {
        try {
            return await fonjepRepository.drop();
        } catch (e) {
            return false;
        }
    }

    async renameCollection(name: string) {
        try {
            return await fonjepRepository.rename(name);
        } catch (e) {
            return false;
        }
    }

    /**
     * |----------------------------|
     * |  Versements Part  |
     * |----------------------------|
     */

    isVersementsProvider = true

    toVersementArray(documents): VersementFonjep[] {
        return documents.map(document => FonjepEntityAdapter.toVersement(document));
    }

    async getVersementsByKey(codePoste: string) {
        return this.toVersementArray(await fonjepVersementRepository.findByCodePoste(codePoste));

    }

    async getVersementsBySiret(siret: Siret) {
        return this.toVersementArray(await fonjepVersementRepository.findBySiret(siret));
    }

    async getVersementsBySiren(siren: Siren) {
        return this.toVersementArray(await fonjepVersementRepository.findBySiren(siren));
    }
}

const fonjepService = new FonjepService();

export default fonjepService;