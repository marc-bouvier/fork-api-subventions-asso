import axios, { AxiosError } from "axios";
import ProviderRequestLog from "./entities/ProviderRequestLog";
import providerRequestRepository from "./repositories/providerRequest.repository";
import RequestConfig from "./@types/RequestConfig";
import { RequestResponse } from "./@types/RequestResponse";
import RequestConfigAdapter from "./adapters/RequestConfigAdapter";
import RequestResponseAdapter from "./adapters/RequestResponseAdapter";

export class ProviderRequestService {
    constructor(private providerId: string) {}

    get<T = any>(url: string, option?: RequestConfig) {
        return this.sendRequest<T>("GET", url, option);
    }

    post<T = any>(url: string, option?: RequestConfig) {
        return this.sendRequest<T>("POST", url, option);
    }

    private sendRequest<T>(type: "GET" | "POST", url: string, option?: RequestConfig): Promise<RequestResponse<T>> {
        const date = new Date();

        const axiosOption = option ? RequestConfigAdapter.toAxiosRequestConfig(option) : {};

        return axios
            .request<T>({
                method: type,
                url,
                ...axiosOption,
            })
            .then(async response => {
                await this.createLog(url, date, response.status, type);
                return RequestResponseAdapter.toRequestReponse(response);
            })
            .catch(async (error: AxiosError) => {
                if (error.status) await this.createLog(url, date, error.status, type);
                throw error;
            });
    }

    private async createLog(route: string, date: Date, responseCode: number, type: "GET" | "POST") {
        const log = new ProviderRequestLog(this.providerId, route, date, responseCode, type);

        await providerRequestRepository.create(log);
    }
}

export default function ProviderRequestFactory(providerId: string) {
    return new ProviderRequestService(providerId);
}
