import * as Sentry from "@sentry/node";
import { CommonGrantDto, Grant, Rna, Siret } from "dto";
import { AssociationIdentifiers, StructureIdentifiers } from "../../@types";
import { StructureIdentifiersEnum } from "../../@enums/StructureIdentifiersEnum";
import providers from "../providers";
import { getIdentifierType } from "../../shared/helpers/IdentifierHelper";
import StructureIdentifiersError from "../../shared/errors/StructureIdentifierError";
import { isSiret } from "../../shared/Validators";
import AssociationIdentifierError from "../../shared/errors/AssociationIdentifierError";
import associationsService from "../associations/associations.service";
import rnaSirenService from "../rna-siren/rnaSiren.service";
import { siretToSiren } from "../../shared/helpers/SirenHelper";
import { BadRequestError } from "../../shared/errors/httpErrors";
import { RnaOnlyError } from "../../shared/errors/GrantError";
import { RawGrant, JoinedRawGrant, RawFullGrant, RawApplication, RawPayment, AnyRawGrant } from "./@types/rawGrant";
import GrantProvider from "./@types/GrantProvider";
import commonGrantService from "./commonGrant.service";

export class GrantService {
    static getRawMethodNameByIdType = {
        [StructureIdentifiersEnum.siret]: "getRawGrantsBySiret",
        [StructureIdentifiersEnum.siren]: "getRawGrantsBySiren",
        [StructureIdentifiersEnum.rna]: "getRawGrantsByRna",
    };

    static getDefaultMethodNameByIdType = {
        [StructureIdentifiersEnum.siret]: "getGrantsBySiret",
        [StructureIdentifiersEnum.siren]: "getGrantsBySiren",
        [StructureIdentifiersEnum.rna]: "getGrantsByRna",
    };

    private validateAndGetStructureType(id: StructureIdentifiers) {
        const idType = getIdentifierType(id);
        if (!idType) throw new StructureIdentifiersError();
        return idType;
    }

    private async validateIsAssociation(id: StructureIdentifiers) {
        const siren = await associationsService.isSirenFromAsso(siretToSiren(id));
        if (!siren) throw new BadRequestError("identifier does not represent an association");
    }

    private async validateAndGetIdentifierInfo(identifier: StructureIdentifiers) {
        let type = this.validateAndGetStructureType(identifier);

        if (type === StructureIdentifiersEnum.rna) {
            const sirenValues = await this.getSirenValues(identifier);
            if (sirenValues) {
                type = sirenValues.type;
                identifier = sirenValues.identifier;
            } else {
                throw new RnaOnlyError(identifier);
            }
        } else {
            this.validateIsAssociation(identifier);
        }
        return { identifier, type };
    }

    private async getSirenValues(rna: Rna) {
        const rnaSirenEntities = await rnaSirenService.find(rna);
        if (rnaSirenEntities && rnaSirenEntities.length) {
            return { identifier: rnaSirenEntities[0].siren, type: StructureIdentifiersEnum.siren };
        }
        return null;
    }

    // appeler adapter pour chaque joine.application joine.payment et joine.fullGrant
    // implementer une classe GrantAdapter pour chaque adapter de demande et de paiment
    async getGrants(identifier: StructureIdentifiers): Promise<Grant[]> {
        const joinedRawGrants = await this.getRawGrants(identifier);
        // parcours chaque joinedRawGrant
        // joinedRawGrants.map(joined => {
        //     // si application ET fullGrants, alors on prend fullGrants
        //     if (joined.applications?.length && joined.fullGrants?.length) {
        //         Sentry.captureMessage(
        //             `A JoinedRawGrant had both applications AND fullGrants with joinKey ${joined.fullGrants[0].joinKey}`,
        //         );
        //     }
        //     if (!joined.payments?.length) {
        //         joined.fullGrants
        //     }
        //     if (joined.fullGrants?.length) {

        //     }
        // });
        // TODO: adapte to DemandeSubventionDto
        return [];
    }

    /**
     * Fetch grants by SIREN or SIRET.
     * Grants can only be referenced by SIRET.
     *
     * If we got an RNA as identifier, we try to get the associated SIREN.
     * If we find it, we proceed the operation using it.
     * If not, we stop and return an empty array.
     *
     * @param identifier Rna, Siren or Siret
     * @returns List of grants (application with paiments)
     */
    async getRawGrants(identifier: StructureIdentifiers): Promise<JoinedRawGrant[]> {
        try {
            const { identifier: sirenOrSiret, type } = await this.validateAndGetIdentifierInfo(identifier);
            const method = GrantService.getRawMethodNameByIdType[type];
            const providers = this.getGrantProviders();
            const rawGrants = [
                ...(
                    await Promise.all(
                        providers.map(p => p[method](sirenOrSiret).then(g => (g || []) as RawGrant[]) || []),
                    )
                ).flat(),
            ];
            return this.joinGrants(rawGrants);
        } catch (e) {
            // IMPROVE: returning empty array does not inform the user that we could not search for grants
            // it does not mean that the association does not received any grants
            if (e instanceof RnaOnlyError) return [] as JoinedRawGrant[];
            else throw e;
        }
    }

    async getRawGrantsByAssociation(id: AssociationIdentifiers): Promise<JoinedRawGrant[]> {
        if (isSiret(id)) throw new AssociationIdentifierError();
        return this.getRawGrants(id);
    }

    async getRawGrantsByEstablishment(siret: Siret): Promise<JoinedRawGrant[]> {
        if (!isSiret(siret)) throw new StructureIdentifiersError("SIRET expected");
        return this.getRawGrants(siret);
    }

    private getGrantProviders(): GrantProvider[] {
        return Object.values(providers).filter(
            p => (p as unknown as GrantProvider).isGrantProvider,
        ) as unknown as GrantProvider[];
    }

    // Use to spot grants or applications sharing the same joinKey (EJ or code_poste)
    // This should not happen and must be investiguated
    private sendDuplicateMessage(joinKey: string) {
        Sentry.captureMessage(`Duplicate joinKey found for grants or applications :  ${joinKey}`);
    }

    private groupRawGrantsByType(rawGrants: AnyRawGrant[]) {
        return rawGrants.reduce(
            (acc, curr) => {
                switch (curr.type) {
                    case "fullGrant":
                        acc["fullGrants"].push(curr);
                        break;
                    case "application":
                        acc["applications"].push(curr);
                        break;
                    case "payment":
                        acc["payments"].push(curr);
                        break;
                }
                return acc;
            },
            {
                fullGrants: [] as RawFullGrant[],
                applications: [] as RawApplication[],
                payments: [] as RawPayment[],
            },
        );
    }

    private joinGrants(rawGrants: AnyRawGrant[]): JoinedRawGrant[] {
        const byKey: Record<string, JoinedRawGrant> = {};
        //TODO: improve JoinedRawGrant after investiguating duplicates possibilities
        // i.e accept only { fullGrant: RawFullGrant , payments: RawPayment[] }
        // and { application: RawApplication, payments: RawPayment[] }
        const newJoinedRawGrant = () => ({
            payments: [],
            applications: [],
            fullGrants: [],
        });
        const addKey = key => (byKey[key] = newJoinedRawGrant());
        const lonelyGrants: JoinedRawGrant[] = [];

        const add = prop => (rawGrant: Required<AnyRawGrant>) => {
            if (!byKey[rawGrant.joinKey]) addKey(rawGrant.joinKey);
            byKey[rawGrant.joinKey][prop].push(rawGrant);
        };
        const addOrSendMessage = type => (rawGrant: Required<RawFullGrant> | Required<RawApplication>) => {
            if (byKey[rawGrant.joinKey]?.[type]) this.sendDuplicateMessage(rawGrant.joinKey);
            else add(type)(rawGrant);
        };
        const addFullGrant = addOrSendMessage("fullGrants");
        const addApplication = addOrSendMessage("applications");
        const addPayment = add("payments");

        // TODO: do we want to keep transforming lonely grants into JoinedRawGrant format ?
        const addLonely = prop => (rawGrant: AnyRawGrant) =>
            lonelyGrants.push({ ...newJoinedRawGrant(), [prop]: [rawGrant] });
        const addLonelyFullGrant = addLonely("fullGrants");
        const addLonelyApplication = addLonely("applications");
        const addLonelyPayment = addLonely("payments");

        const joiner = (add, addLonely) => grant => {
            if (grant.joinKey) add(grant);
            else addLonely(grant);
        };

        const grantsByType = this.groupRawGrantsByType(rawGrants);

        // order matters if we want fullGrants to be more accurate than applications in case of duplicates
        // TODO: investiguate if duplicates is something that can happen
        grantsByType.fullGrants?.forEach(joiner(addFullGrant, addLonelyFullGrant));
        grantsByType.applications?.forEach(joiner(addApplication, addLonelyApplication));
        grantsByType.payments?.forEach(joiner(addPayment, addLonelyPayment));

        return [...Object.values(byKey), ...lonelyGrants];
    }

    async getCommonGrants(id: StructureIdentifiers, publishable = false): Promise<CommonGrantDto[]> {
        const raws = await this.getRawGrants(id);

        return raws
            .map(raw => commonGrantService.rawToCommon(raw, publishable))
            .filter(adapted => !!adapted) as CommonGrantDto[];
    }
}

const grantService = new GrantService();

export default grantService;
