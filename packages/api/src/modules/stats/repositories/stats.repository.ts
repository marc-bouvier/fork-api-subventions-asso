import { RoleEnum } from "../../../@enums/Roles";
import { DefaultObject } from "../../../@types";
import db from "../../../shared/MongoConnection";
import { getMonthlyDataObject } from "../../../shared/helpers/DateHelper";
import { NbRequestsPerMonthRequest } from "@api-subventions-asso/dto";

export class StatsRepository {
    private readonly collection = db.collection("log");

    public async countUsersByRequestNbOnPeriod(
        start: Date,
        end: Date,
        nbReq: number,
        includesAdmin: boolean
    ): Promise<number> {
        const matchQuery: { $match: DefaultObject } = {
            $match: {
                timestamp: {
                    $gte: start,
                    $lte: end
                },
                "meta.req.url": /\/(association|etablissement)\/.{9,14}$/
            }
        };
        if (!includesAdmin) {
            matchQuery.$match["meta.req.user.roles"] = { $nin: [RoleEnum.admin] };
        }

        return (
            (
                await this.collection
                    .aggregate([
                        matchQuery,
                        {
                            $group: { _id: "$meta.req.user.email", nbOfRequest: { $sum: 1 } }
                        },
                        { $match: { nbOfRequest: { $gte: nbReq } } },
                        { $count: "nbOfUsers" }
                    ])
                    .next()
            )?.nbOfUsers || 0
        ); // If no stats found nbOfUsers is null but whant retrun an number
    }

    public async countMedianRequestsOnPeriod(start: Date, end: Date, includesAdmin: boolean): Promise<number> {
        const buildQuery = () => {
            const matchQuery: { $match: DefaultObject } = {
                $match: {
                    timestamp: {
                        $gte: start,
                        $lte: end
                    },
                    "meta.req.user.email": { $ne: null },
                    "meta.req.url": /\/(association|etablissement)\/.{9,14}$/
                }
            };
            if (!includesAdmin) {
                matchQuery.$match["meta.req.user.roles"] = { $nin: [RoleEnum.admin] };
            }

            return [
                matchQuery,
                { $group: { _id: "$meta.req.user.email", nbOfRequest: { $sum: 1 } } },
                { $sort: { nbOfRequest: 1 } }
            ];
        };

        const result = await this.collection.aggregate(buildQuery()).toArray();

        if (!result.length) return 0;

        const middle = Math.floor(result.length / 2);

        if (result.length % 2 === 0) {
            return (result[middle - 1].nbOfRequest + result[middle].nbOfRequest) / 2;
        }

        return result[middle].nbOfRequest;
    }

    public async countRequestsPerMonthByYear(year: number, includesAdmin: boolean): Promise<NbRequestsPerMonthRequest> {
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 0);
        const buildQuery = () => {
            const matchQuery: { $match: DefaultObject } = {
                $match: {
                    timestamp: {
                        $gte: start,
                        $lte: end
                    },
                    "meta.req.user.email": { $ne: null }
                }
            };
            if (!includesAdmin) {
                matchQuery.$match["meta.req.user.roles"] = { $nin: [RoleEnum.admin] };
            }
            const annotateQuery = { $addFields: { month: { $month: "$timestamp" } } };

            return [matchQuery, annotateQuery, { $group: { _id: "$month", nbOfRequest: { $sum: 1 } } }];
        };

        const queryResult = await this.collection.aggregate(buildQuery()).toArray();
        return getMonthlyDataObject(queryResult, "_id", "nbOfRequest");
    }

    public getLogsWithRegexUrl(regex: RegExp) {
        return this.collection.find({
            "meta.req.url": regex
        });
    }
}

const statsRepository = new StatsRepository();
export default statsRepository;