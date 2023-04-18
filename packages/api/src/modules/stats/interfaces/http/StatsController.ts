import {
    AssociationTopDtoResponse,
    MonthlyVisitsDtoResponse,
    StatsRequestDtoResponse,
    StatsRequestsMedianDtoResponse,
    UsersByStatusResponseDto,
} from "@api-subventions-asso/dto";
import { Controller, Get, Query, Route, Security, Tags } from "tsoa";
import statsService from "../../stats.service";
import { BadRequestError } from "../../../../shared/errors/httpErrors";

@Route("stats")
@Security("jwt", ["admin"])
@Tags("Stats Controller")
export class StatsController extends Controller {
    /**
     * Permet de récupérer le nombre d'utilisateurs qui ont fait plus de X requêtes sur une période données
     *
     * @summary Permet de récupérer le nombre d'utilisateurs qui ont fait plus de X requêtes sur une période données
     * @param start Timestamp starting date for the period
     * @param end Timestamp ending date for the period
     * @param nbReq Number minimal number of requests that user must have done in the defined period
     * @param {string=} [includesAdmin = "false"] true if we include admin in stats, false for exlude admin (All value other of "true" will be considered as false)
     * @returns {StatsRequestDtoResponse}
     */
    @Get("/requests")
    async getNbUsersByRequestsOnPeriod(
        @Query() start: string,
        @Query() end: string,
        @Query() nbReq: string,
        @Query() includesAdmin = "false",
    ): Promise<StatsRequestDtoResponse> {
        const result = await statsService.getNbUsersByRequestsOnPeriod(
            new Date(start),
            new Date(end),
            Number(nbReq),
            includesAdmin === "true",
        );
        return { data: result };
    }

    /**
     * Permet de récupérer le nombre médian de requêtes sur un période donnée
     *
     * @summary Permet de récupérer le nombre médian de requêtes sur un période donnée
     * @param start Timestamp starting date for the period
     * @param end Timestamp ending date for the period
     * @param {string=} [includesAdmin = "false"] true if we include admin in stats, false for exclude admin (All value other of "true" will be considered as false)
     * @returns
     */
    @Get("/requests/median")
    async getMedianRequestOnPeriod(
        @Query() start: string,
        @Query() end: string,
        @Query() includesAdmin = "false",
    ): Promise<StatsRequestsMedianDtoResponse> {
        const result = await statsService.getMedianRequestsOnPeriod(
            new Date(start),
            new Date(end),
            includesAdmin === "true",
        );
        return { data: result };
    }

    /**
     * Permet de récupérer le nombre total de requêtes sur une année donnée
     *
     * @summary Permet de récupérer le nombre total de requêtes sur une année donnée
     * @param year
     * @returns
     */
    @Get("/visits/monthly/{year}")
    async getVisitsPerMonthByYear(year: string): Promise<MonthlyVisitsDtoResponse> {
        // TODO rename function and route, update test and front
        if (isNaN(Number(year))) throw new BadRequestError("'date' must be a number");
        return await statsService.getVisitsPerMonthByYear(Number(year));
    }

    /**
     * Permet de récupérer le nombre d'utilisateurs cumulés par mois pour une année donnée
     *
     * @summary Permet de récupérer le nombre d'utilisateurs cumulés par mois pour une année donnée
     * @param year
     * @returns
     */
    @Get("/users/monthly/{year}")
    async getCumulatedUsersPerMonthByYear(year: string): Promise<unknown> {
        if (isNaN(Number(year))) throw new BadRequestError("'date' must be a number");
        const result = await statsService.getMonthlyUserNbByYear(Number(year));
        return { data: result };
    }

    /**
     * Permet de récupérer le nombre d'utilisateur par statut
     * 4 statuts sont distingués : admin, actif (a fait une requête depuis moins de 7 jours), idle (est inactif depuis plus de 7 jours) et inactive (n'a pas activé son compte)
     *
     * @summary Permet de récupérer le nombre d'utilisateur par statut
     */
    @Get("/users/status")
    async getUserCountByStatus(): Promise<UsersByStatusResponseDto> {
        const result = await statsService.getUserCountByStatus();
        return { data: result };
    }

    /**
     * Permet de récupérer les associations les plus visitées et le nombre de requêtes associées par périodes (Une période correspond forcément à un mois)
     *
     * @summary Permet de récupérer les associations les plus visitées et le nombre de requêtes associées par périodes (Une période correspond forcément à un mois)
     * @param limit Number of returned associations. Default is 5
     * @param startYear The full number year of the start period. Default as one year before the current year
     * @param startMonth Number of the start period month (January as 0). Default as 0. For exemple startYear = 2023 and startMonth = 0, the start period has 01/01/2023
     * @param endYear The full number year of the end period. Default is current year
     * @param endMonth Number of the end period month (January as 0). Default as 0. For exemple endYear = 2023 and endMonth = 0, the end period has 31/01/2023
     */
    @Get("/associations")
    async getTopAssociations(
        @Query() limit = "5",
        @Query() startYear: string | null = null,
        @Query() startMonth: string | null = null,
        @Query() endYear: string | null = null,
        @Query() endMonth: string | null = null,
    ): Promise<AssociationTopDtoResponse> {
        if (isNaN(Number(limit))) throw new BadRequestError("'limit' must be a number");
        if (startYear !== null && isNaN(Number(startYear))) throw new BadRequestError("'startYear' must be a number");
        if (startMonth !== null && isNaN(Number(startMonth)))
            throw new BadRequestError("'startMonth' must be a number");
        if (endYear !== null && isNaN(Number(endYear))) throw new BadRequestError("'endYear' must be a number");
        if (endMonth !== null && isNaN(Number(endMonth))) throw new BadRequestError("'endMonth' must be a number");

        const now = new Date();

        const endMonthNumber =
            endMonth != null && !isNaN(Number(endMonth)) ? Number(endMonth) + 1 : endYear ? 0 : now.getMonth() + 1;

        const startMonthNumber =
            startMonth != null && !isNaN(Number(startMonth)) ? Number(startMonth) : startYear ? 0 : now.getMonth();

        const endYearNumber = endYear ? Number(endYear) : now.getFullYear();
        const startYearNumber = startYear ? Number(startYear) : now.getFullYear() - 1;

        const end = new Date(Date.UTC(endYearNumber, endMonthNumber));
        const start = new Date(Date.UTC(startYearNumber, startMonthNumber));
        const result = await statsService.getTopAssociationsByPeriod(Number(limit), start, end);
        return { data: result };
    }

    /**
     * Permet de récupérer le nombre d'utilisateurs qui ont fait en moyenne un certain nombre de requêtes (depuis un an)
     *
     * @summary Permet de récupérer le nombre d'utilisateurs qui ont fait en moyenne un certain nombre de requêtes (depuis un an)
     */
    @Get("/users-by-request")
    async getUsersByRequest() {
        const result = await statsService.getUsersByRequest();
        return { data: result };
    }

    /**
     * Permet de récupérer les mails des utilisateurs qui ont exporté le tableau (depuis le front)
     *
     * @summary Permet de récupérer les mails des utilisateurs qui ont exporté le tableau (depuis le front)
     * @deprecated
     */
    @Get("/exporters")
    async getExportersEmails() {
        const result = await statsService.getExportersEmails();
        return { emails: result };
    }
}
