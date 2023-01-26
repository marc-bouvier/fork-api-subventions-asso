import request from "supertest";
import statsService from "../../../src/modules/stats/stats.service";
import getAdminToken from "../../__helpers__/getAdminToken";
import getUserToken from "../../__helpers__/getUserToken";
import UserDbo from "../../../src/modules/user/repositories/dbo/UserDbo";
import userFixture from "../user/__fixtures__/entity";
import db, { connectDB } from "../../../src/shared/MongoConnection";
import visitsFixture, { THIS_MONTH, TODAY } from "../association-visits/__fixtures__/entity";
import nameFixture from "../association-name/__fixtures__/entity";
import statsAssociationsVisitRepository from "../../../src/modules/stats/repositories/statsAssociationsVisit.repository";
import { DefaultObject } from "../../../src/@types";
import { createAndActiveUser, createUser } from "../../__helpers__/userHelper";
import userRepository from "../../../src/modules/user/repositories/user.repository";

const g = global as unknown as { app: unknown };

describe("/stats", () => {
    const spyGetNbUsersByRequestsOnPeriod = jest.spyOn(statsService, "getNbUsersByRequestsOnPeriod");

    describe("/requests", () => {
        describe("/", () => {
            const TODAY = new Date();
            const YESTERDAY = new Date(TODAY).setDate(TODAY.getDate() + 1);
            const MIN_REQUESTS = "10";

            it("should return data with HTTP status code 200", async () => {
                const DATA = 5;
                spyGetNbUsersByRequestsOnPeriod.mockImplementationOnce(async () => DATA);
                const expected = { data: DATA };
                const actual = await request(g.app)
                    .get("/stats/requests")
                    .query({
                        nbReq: MIN_REQUESTS,
                        start: YESTERDAY.toString(),
                        end: TODAY.toString()
                    })
                    .set("x-access-token", await getAdminToken())
                    .set("Accept", "application/json");
                expect(actual.statusCode).toEqual(200);
                expect(actual.body).toEqual(expected);
            });

            it("should return error with HTTP status code 500", async () => {
                const ERROR_MESSAGE = "Something went wrong";
                spyGetNbUsersByRequestsOnPeriod.mockImplementationOnce(async () =>
                    Promise.reject(new Error(ERROR_MESSAGE))
                );
                const expected = { message: ERROR_MESSAGE };
                const actual = await request(g.app)
                    .get("/stats/requests")
                    .query({
                        nbReq: MIN_REQUESTS,
                        start: YESTERDAY.toString(),
                        end: TODAY.toString()
                    })
                    .set("x-access-token", await getAdminToken())
                    .set("Accept", "application/json");

                expect(actual.statusCode).toBe(500);
                expect(actual.body).toEqual(expected);
            });

            it("should return error with HTTP status code 401", async () => {
                const ERROR_MESSAGE = "Something went wrong";
                spyGetNbUsersByRequestsOnPeriod.mockImplementationOnce(async () =>
                    Promise.reject(new Error(ERROR_MESSAGE))
                );
                const expected = {
                    message: "JWT does not contain required scope."
                };
                const actual = await request(g.app)
                    .get("/stats/requests")
                    .query({
                        nbReq: MIN_REQUESTS,
                        start: YESTERDAY.toString(),
                        end: TODAY.toString()
                    })
                    .set("x-access-token", await getUserToken())
                    .set("Accept", "application/json");

                expect(actual.statusCode).toBe(401);
                expect(actual.body).toEqual(expected);
            });
        });

        describe("getMedianRequestOnPeriod", () => {
            const TODAY = new Date();
            const YESTERDAY = new Date(TODAY).setDate(TODAY.getDate() + 1);
            const spyGetMedianRequestsOnPeriod = jest.spyOn(statsService, "getMedianRequestsOnPeriod");

            it("should return data with HTTP status code 200", async () => {
                const DATA = 2;
                spyGetMedianRequestsOnPeriod.mockImplementationOnce(async () => DATA);
                const expected = { data: DATA };
                const actual = await request(g.app)
                    .get("/stats/requests/median")
                    .query({ start: YESTERDAY.toString(), end: TODAY.toString() })
                    .set("x-access-token", await getAdminToken())
                    .set("Accept", "application/json");
                expect(actual.statusCode).toEqual(200);
                expect(actual.body).toEqual(expected);
            });

            it("should return error with HTTP status code 500", async () => {
                const ERROR_MESSAGE = "Something went wrong";
                spyGetMedianRequestsOnPeriod.mockImplementationOnce(async () =>
                    Promise.reject(new Error(ERROR_MESSAGE))
                );
                const expected = { message: ERROR_MESSAGE };
                const actual = await request(g.app)
                    .get("/stats/requests/median")
                    .query({ start: YESTERDAY.toString(), end: TODAY.toString() })
                    .set("x-access-token", await getAdminToken())
                    .set("Accept", "application/json");

                expect(actual.statusCode).toBe(500);
                expect(actual.body).toEqual(expected);
            });

            it("should return error with HTTP status code 401", async () => {
                const ERROR_MESSAGE = "Something went wrong";
                spyGetMedianRequestsOnPeriod.mockImplementationOnce(async () =>
                    Promise.reject(new Error(ERROR_MESSAGE))
                );
                const expected = {
                    message: "JWT does not contain required scope."
                };
                const actual = await request(g.app)
                    .get("/stats/requests/median")
                    .query({ start: YESTERDAY.toString(), end: TODAY.toString() })
                    .set("x-access-token", await getUserToken())
                    .set("Accept", "application/json")
                    .expect(401, expected);
            });
        });
    });

    describe("/associations", () => {
        describe("getTopAssociationsByPeriod()", () => {
            async function makeRequest(query) {
                return request(g.app)
                    .get(`/stats/associations${query}`)
                    .set("x-access-token", await getAdminToken())
                    .set("Accept", "application/json");
            }

            function makeRequestWithParams(
                limit: undefined | number = undefined,
                start: undefined | Date = undefined,
                end: undefined | Date = undefined
            ) {
                const queryObj: DefaultObject<string | number> = {};

                if (limit) queryObj.limit = limit;
                if (start) {
                    queryObj.startYear = start.getFullYear();
                    queryObj.startMonth = start.getMonth();
                }
                if (end) {
                    queryObj.endYear = end.getFullYear();
                    queryObj.endMonth = end.getMonth();
                }

                const query = "?" + new URLSearchParams(queryObj as unknown as URLSearchParams).toString();
                return makeRequest(query);
            }

            const collection = db.collection(statsAssociationsVisitRepository.collectionName);
            const nameCollection = db.collection("association-name");
            const serviceSpy = jest.spyOn(statsService, "getTopAssociationsByPeriod");

            beforeEach(async () => {
                await collection.insertMany(visitsFixture);
                await nameCollection.insertMany(nameFixture);
            });

            describe("should return data with HTTP status code 200", () => {
                it("should accept no args", async () => {
                    const data = [
                        {
                            name: "GROUPEMENT D EMPLOYEURS PROFESSION SPORT LOISIRS",
                            visits: 4
                        },
                        {
                            name: "ORIN ÀBAJADE",
                            visits: 2
                        },
                        {
                            name: "LA CASERNE BASCULE",
                            visits: 2
                        },
                        {
                            name: "ASSOCIATION AURORE",
                            visits: 2
                        },
                        {
                            name: "AVENIR ET JOIE - JOC",
                            visits: 2
                        }
                    ];

                    const response = await makeRequestWithParams();
                    expect(response.statusCode).toBe(200);
                    expect(response.body).toMatchObject({
                        data: expect.arrayContaining(data)
                    });
                });

                it("should use args", async () => {
                    const data = [
                        {
                            name: "GROUPEMENT D EMPLOYEURS PROFESSION SPORT LOISIRS",
                            visits: 3
                        },
                        {
                            name: "ORIN ÀBAJADE",
                            visits: 2
                        }
                    ];
                    const limit = 2;
                    const start = THIS_MONTH;
                    const end = TODAY;
                    const response = await makeRequestWithParams(limit, start, end);

                    expect(response.statusCode).toBe(200);
                    expect(response.body).toMatchObject({ data });
                });
            });

            it("should reject wrong limit with HTTP status code 400", async () => {
                const ERROR_MESSAGE = "'limit' must be a number";
                const expected = { message: ERROR_MESSAGE };
                const actual = await makeRequestWithParams("zerty" as unknown as number);
                expect(actual.statusCode).toBe(400);
                expect(actual.body).toEqual(expected);
            });

            it("should reject wrong end year with HTTP status code 400", async () => {
                const ERROR_MESSAGE = "'endYear' must be a number";
                const expected = { message: ERROR_MESSAGE };
                const actual = await makeRequest("?endYear=zerty");
                expect(actual.statusCode).toBe(400);
                expect(actual.body).toEqual(expected);
            });

            it("should reject wrong end month with HTTP status code 400", async () => {
                const ERROR_MESSAGE = "'endMonth' must be a number";
                const expected = { message: ERROR_MESSAGE };
                const actual = await makeRequest("?endMonth=zerty");
                expect(actual.statusCode).toBe(400);

                expect(actual.body).toEqual(expected);
            });

            it("should reject wrong start year with HTTP status code 400", async () => {
                const ERROR_MESSAGE = "'startYear' must be a number";
                const expected = { message: ERROR_MESSAGE };
                const actual = await makeRequest("?startYear=zerty");
                expect(actual.statusCode).toBe(400);
                expect(actual.body).toEqual(expected);
            });

            it("should reject wrong start month with HTTP status code 400", async () => {
                const ERROR_MESSAGE = "'startMonth' must be a number";
                const expected = { message: ERROR_MESSAGE };
                const actual = await makeRequest("?startMonth=zerty");
                expect(actual.statusCode).toBe(400);
                expect(actual.body).toEqual(expected);
            });

            it("should send 500 if random error thrown", async () => {
                const ERROR_MESSAGE = "Something went wrong";
                serviceSpy.mockRejectedValueOnce(Error(ERROR_MESSAGE));
                const expected = { message: ERROR_MESSAGE };
                const actual = await makeRequestWithParams();
                expect(actual.statusCode).toBe(500);
                expect(actual.body).toEqual(expected);
            });
        });
    });

    describe("/users", () => {
        describe("/monthly/{year}", () => {
            const YEAR = 2022;
            const collection = db.collection<UserDbo>("users");
            beforeEach(() => {
                collection.insertMany(userFixture);
            });

            it("should return data with HTTP status code 200", async () => {
                const DATA = {
                    nombres_utilisateurs_avant_annee: 1,
                    evolution_nombres_utilisateurs: [1, 1, 1, 2, 2, 2, 2, 2, 2, 2, 3, 3]
                };
                const expected = { data: DATA };
                await request(g.app)
                    .get(`/stats/users/monthly/${YEAR}`)
                    .set("x-access-token", await getAdminToken())
                    .set("Accept", "application/json")
                    .expect(200, expected);
            });
        });

        describe("/status", () => {
            it("should return UsersByStatusSuccessResponse", async () => {
                const ACTIVE_USER_EMAIL = "active.user@beta.gouv.fr";
                await createAndActiveUser(ACTIVE_USER_EMAIL);
                await createAndActiveUser("idle.user@beta.gouv.fr");
                await createUser("inactive.user@beta.gouv.fr");
                const ACTIVE_USER = (await userRepository.findByEmail(ACTIVE_USER_EMAIL)) as UserDbo;
                ACTIVE_USER.stats.lastSearchDate = new Date();
                await userRepository.update(ACTIVE_USER);
                const expected = { data: { admin: 1, active: 1, idle: 1, inactive: 1 } };
                await request(g.app)
                    .get(`/stats/users/status`)
                    // getAdminToken() creates an admin user
                    .set("x-access-token", await getAdminToken())
                    .set("Accept", "application/json")
                    .expect(200, expected);
            });
        });
    });
});
