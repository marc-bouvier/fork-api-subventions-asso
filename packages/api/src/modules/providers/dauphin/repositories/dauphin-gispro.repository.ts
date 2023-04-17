import { Siren, Siret } from "@api-subventions-asso/dto";
import MigrationRepository from "../../../../shared/MigrationRepository";
import DauphinGisproDbo from "./dbo/DauphinGisproDbo";

export class DauphinGisproRepository extends MigrationRepository<DauphinGisproDbo> {
    readonly collectionName = "dauphin-gispro";

    async createIndexes() {
        await this.collection.createIndex({ "dauphin.demandeur.SIRET.complet": 1 });
        await this.collection.createIndex({ "dauphin.demandeur.SIRET.SIREN": 1 });
        // Unique id on dauphin
        await this.collection.createIndex({ "dauphin.reference": 1 });
        // Unique id on gispro
        await this.collection.createIndex({ "dauphin.multiFinancement.financeurs.source.reference": 1 });
    }

    async upsert(entity: DauphinGisproDbo) {
        return this.collection.updateOne(
            {
                "dauphin.reference": entity.dauphin.reference,
            },
            { $set: entity },
            { upsert: true },
        );
    }

    findBySiret(siret: Siret) {
        return this.collection
            .find({
                "dauphin.demandeur.SIRET.complet": siret,
            })
            .toArray();
    }

    findBySiren(siren: Siren) {
        return this.collection
            .find({
                "dauphin.demandeur.SIRET.SIREN": siren,
            })
            .toArray();
    }

    findOneByDauphinId(codeDossier: string) {
        return this.collection.findOne({
            "dauphin.multiFinancement.financeurs.source.reference": codeDossier,
        });
    }

    async getLastUpdateBySiren(siren: Siren): Promise<Date | undefined> {
        const result = await this.collection
            .aggregate([
                {
                    $match: {
                        "dauphin.demandeur.SIRET.SIREN": siren,
                    },
                },
                {
                    $addFields: {
                        dateVersion: { $toDate: "$dauphin._document.dateVersion" },
                    },
                },
                {
                    $sort: {
                        dateVersion: -1,
                    },
                },
                {
                    $limit: 1,
                },
            ])
            .toArray();
        if (result.length) return new Date(result[0].dauphin._document.dateVersion);
        return undefined;
    }

    /**
     * @deprecated
     */
    async getLastUpdateBySiret(siret: Siret): Promise<Date | undefined> {
        const result = await this.collection
            .aggregate([
                {
                    $match: {
                        "dauphin.demandeur.SIRET.complet": siret,
                    },
                },
                {
                    $addFields: {
                        dateVersion: { $toDate: "$dauphin._document.dateVersion" },
                    },
                },
                {
                    $sort: {
                        dateVersion: -1,
                    },
                },
                {
                    $limit: 1,
                },
            ])
            .toArray();

        if (result.length) return new Date(result[0]._document.dateVersion);
        return undefined;
    }
}

const dauphinGisproRepository = new DauphinGisproRepository();

export default dauphinGisproRepository;
