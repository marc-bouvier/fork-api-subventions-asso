import { Rna, Siren, Siret, Association, Etablissement } from "@api-subventions-asso/dto";
import axios from "axios";
import { Document } from "@api-subventions-asso/dto/search/Document";
import { ProviderEnum } from "../../../@enums/ProviderEnum";
import { AssociationIdentifiers, DefaultObject, StructureIdentifiers } from "../../../@types";
import { API_ASSO_URL, API_ASSO_TOKEN } from "../../../configurations/apis.conf";
import CacheData from "../../../shared/Cache";
import { siretToSiren } from "../../../shared/helpers/SirenHelper";
import { CACHE_TIMES } from "../../../shared/helpers/TimeHelper";
import AssociationsProvider from "../../associations/@types/AssociationsProvider";
import DocumentProvider from "../../documents/@types/DocumentsProvider";
import EtablissementProvider from "../../etablissements/@types/EtablissementProvider";
import { isDateNewer } from "../../../shared/helpers/DateHelper";
import associationNameService from "../../association-name/associationName.service";
import ApiAssoDtoAdapter from "./adapters/ApiAssoDtoAdapter";
import StructureDto, { DocumentDto, StructureDacDocumentDto, StructureRnaDocumentDto } from "./dto/StructureDto";
import { RnaStructureDto } from "./dto/RnaStructureDto";
import { SirenStructureDto } from "./dto/SirenStructureDto";

export class ApiAssoService implements AssociationsProvider, EtablissementProvider, DocumentProvider {
    public provider = {
        name: "API ASSO",
        type: ProviderEnum.api,
        description:
            "L'API Asso est une API portée par la DJEPVA et la DNUM des ministères sociaux qui expose des données sur les associations issues du RNA, de l'INSEE (SIREN/SIRET) et du Compte Asso."
    };
    private requestCache = new CacheData<unknown>(CACHE_TIMES.ONE_DAY);

    constructor() {
        associationNameService.setProviderScore(ApiAssoDtoAdapter.providerNameRna, 1);
        associationNameService.setProviderScore(ApiAssoDtoAdapter.providerNameSiren, 1);
    }

    private async sendRequest<T>(route: string): Promise<T | null> {
        if (this.requestCache.has(route)) return this.requestCache.get(route)[0] as T;

        try {
            const res = await axios.get<T>(`${API_ASSO_URL}/${route}`, {
                headers: {
                    Accept: "application/json",
                    "X-Gravitee-Api-Key": API_ASSO_TOKEN as string
                }
            });

            if (res.status === 200) {
                this.requestCache.add(route, res.data);
                return res.data;
            }
            return null;
        } catch {
            return null;
        }
    }

    private async findAssociationByRna(rna: Rna): Promise<Association | null> {
        const rnaStructure = await this.sendRequest<RnaStructureDto>(`/api/rna/${rna}`);

        if (!rnaStructure) return null;
        return ApiAssoDtoAdapter.rnaStructureToAssociation(rnaStructure);
    }

    private async findAssociationBySiren(siren: Siren): Promise<Association | null> {
        const sirenStructure = await this.sendRequest<SirenStructureDto>(`/api/siren/${siren}`);

        if (!sirenStructure) return null;
        return ApiAssoDtoAdapter.sirenStructureToAssociation(sirenStructure);
    }

    private async findEtablissementsBySiren(siren: Siren): Promise<Etablissement[] | null> {
        const structure = await this.sendRequest<StructureDto>(`/api/structure/${siren}`);

        if (!structure) return null;

        await this.saveStructureInAssociationName(structure);

        return structure.etablissement.map(etablissement =>
            ApiAssoDtoAdapter.toEtablissement(
                etablissement,
                structure.rib,
                structure.representant_legal,
                structure.identite.date_modif_siren
            )
        );
    }

    private async saveStructureInAssociationName(structure: StructureDto) {
        if (!structure?.identite.id_siren || !structure?.identite.id_rna || !structure?.identite.nom) return;

        const lastUpdateDateRna = ApiAssoDtoAdapter.apiDateToDate(structure.identite.date_modif_rna);
        const lastUpdateDateSiren = ApiAssoDtoAdapter.apiDateToDate(structure.identite.date_modif_siren);

        const rnaIsMoreRecent = isDateNewer(lastUpdateDateRna, lastUpdateDateSiren);

        await associationNameService.upsert({
            rna: structure.identite.id_rna,
            siren: structure.identite.id_siren,
            name: structure.identite.nom,
            provider: rnaIsMoreRecent ? ApiAssoDtoAdapter.providerNameRna : ApiAssoDtoAdapter.providerNameSiren,
            lastUpdate: rnaIsMoreRecent ? lastUpdateDateRna : lastUpdateDateSiren
        });
    }

    private filterRnaDocuments(documents: StructureRnaDocumentDto[]) {
        const acceptedType = ["MD", "LDC", "PV", "STC"];

        const sortByYearAndTimeAsc = (a: StructureRnaDocumentDto, b: StructureRnaDocumentDto) => {
            return parseFloat(`${a.annee}.${a.time}`) - parseFloat(`${b.annee}.${b.time}`);
        };

        return acceptedType
            .map(type =>
                documents
                    .filter(document => document["sous_type"].toLocaleUpperCase() === type)
                    .sort(sortByYearAndTimeAsc)
                    // Get most recent document
                    .pop()
            )
            .filter(document => document) as StructureRnaDocumentDto[];
    }

    private filterDacDocuments(documents: StructureDacDocumentDto[]) {
        const acceptedType = [
            "RFA",
            "BPA",
            "RCA",
            "RAR",
            "CAP",
            "Jeunesse et Education Populaire (JEP)",
            "Education nationale",
            "Formation"
        ];

        const sortByTimeDepotAsc = (a: StructureDacDocumentDto, b: StructureDacDocumentDto) =>
            new Date(a.time_depot).getTime() - new Date(b.time_depot).getTime();

        return acceptedType
            .map(type =>
                documents
                    .filter(document => document.meta.type.toLocaleUpperCase() === type.toLocaleUpperCase())
                    .sort(sortByTimeDepotAsc)
                    // Get most recent document
                    .pop()
            )
            .filter(document => document) as StructureDacDocumentDto[];
    }
    private filterRibsInDacDocuments(documents: StructureDacDocumentDto[]) {
        const ribs = documents.filter(
            document =>
                document.meta.type.toLocaleUpperCase() === "RIB" && document.url && document.meta.iban !== "null"
        );

        const uniquesRibs = ribs.reduce((acc, rib) => {
            const ribName = rib.meta.iban || rib.nom;
            if (!acc[ribName] || new Date(rib.time_depot).getTime() > new Date(acc[ribName].time_depot).getTime()) {
                acc[ribName] = rib;
            }
            return acc;
        }, {} as DefaultObject<StructureDacDocumentDto>);

        return Object.values(uniquesRibs);
    }

    private filterActiveDacDocuments(documents: StructureDacDocumentDto[], structureIdentifier: StructureIdentifiers) {
        if (!Array.isArray(documents)) {
            console.error("API-ASSO documents is not an array for structure " + structureIdentifier);
            return [];
        }
        return documents.filter(document => document.meta.etat === "courant");
    }

    private async findDocuments(identifier: AssociationIdentifiers): Promise<Document[]> {
        const response = await this.sendRequest<DocumentDto>(`/proxy_db_asso/documents/${identifier}`);

        if (!response) return [];

        const filtredRnaDocument = this.filterRnaDocuments(response.asso.documents.document_rna || []);
        const activeDacDocuments = this.filterActiveDacDocuments(
            response.asso.documents.document_dac || [],
            identifier
        );
        const filtredDacDocument = this.filterDacDocuments(activeDacDocuments);
        const ribs = this.filterRibsInDacDocuments(activeDacDocuments);

        return [
            ...filtredRnaDocument.map(document => ApiAssoDtoAdapter.rnaDocumentToDocument(document)),
            ...filtredDacDocument.map(document => ApiAssoDtoAdapter.dacDocumentToDocument(document)),
            ...ribs.map(document => ApiAssoDtoAdapter.dacDocumentToRib(document))
        ];
    }

    /**
     * |-------------------------|
     * |    Associations Part    |
     * |-------------------------|
     */

    isAssociationsProvider = true;

    async getAssociationsBySiren(siren: Siren): Promise<Association[] | null> {
        const sirenAssociation = await this.findAssociationBySiren(siren);

        if (!sirenAssociation) return null;

        const groupedIdentifier = await associationNameService.getGroupedIdentifiers(siren);

        if (!groupedIdentifier.rna) return [sirenAssociation];

        const rnaAssociation = await this.findAssociationByRna(groupedIdentifier.rna);

        if (!rnaAssociation) return [sirenAssociation];

        return [sirenAssociation, rnaAssociation];
    }

    async getAssociationsBySiret(siret: Siret): Promise<Association[] | null> {
        return this.getAssociationsBySiren(siretToSiren(siret));
    }

    async getAssociationsByRna(rna: Rna): Promise<Association[] | null> {
        const rnaAssociation = await this.findAssociationByRna(rna);

        if (!rnaAssociation) return null;

        const groupedIdentifier = await associationNameService.getGroupedIdentifiers(rna);

        if (!groupedIdentifier.siren) return [rnaAssociation];

        const sirenAssociation = await this.findAssociationBySiren(groupedIdentifier.siren);

        if (!sirenAssociation) return [rnaAssociation];

        return [rnaAssociation, sirenAssociation];
    }

    /**
     * |-------------------------|
     * |   Etablissement Part    |
     * |-------------------------|
     */

    isEtablissementProvider = true;

    async getEtablissementsBySiret(siret: Siret): Promise<Etablissement[] | null> {
        const siren = siretToSiren(siret);

        const result = await this.getEtablissementsBySiren(siren);

        if (!result) return null;

        return result.filter(e => e.siret[0].value == siret);
    }

    async getEtablissementsBySiren(siren: Siren): Promise<Etablissement[] | null> {
        const etablissements = await this.findEtablissementsBySiren(siren);

        if (!etablissements) return null;

        return etablissements;
    }

    /**
     * |---------------------|
     * |   Documents Part    |
     * |---------------------|
     */

    isDocumentProvider = true;

    async getDocumentsBySiren(siren: Siren) {
        return this.findDocuments(siren);
    }

    async getDocumentsBySiret(siret: Siret) {
        const siren = siretToSiren(siret);

        const documents = await this.findDocuments(siren);

        if (!documents) return documents;

        const filteredDocuments = documents.filter(document => {
            if (document.__meta__.siret == siret) return true;
            return false;
        });

        return filteredDocuments;
    }

    async getDocumentsByRna(rna: Rna) {
        return this.findDocuments(rna);
    }
}

const apiAssoService = new ApiAssoService();

export default apiAssoService;
