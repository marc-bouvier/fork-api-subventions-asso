import axios from "axios";
import ProviderRequestFactory, { ProviderRequestService } from "./providerRequest.service";
import providerRequestRepository from "./repositories/providerRequest.repository";

jest.mock("./repositories/providerRequest.repository");

describe("ProviderRequestService", () => {
    let providerRequestService: ProviderRequestService;
    let sendRequestSpy: jest.SpyInstance;
    const providerId = "ExampleProvider";

    beforeEach(() => {
        providerRequestService = ProviderRequestFactory(providerId);
    });

    describe("Get", () => {
        beforeEach(() => {
            // @ts-expect-error sendRequest is private method
            sendRequestSpy = jest.spyOn(providerRequestService, "sendRequest").mockResolvedValue({});
        });

        it("should call sendRequest Method", async () => {
            const url = "/test";
            const option = { headers: { test: true } };
            await providerRequestService.get(url, option);

            expect(sendRequestSpy).toBeCalledWith("GET", url, option);
        });
    });

    describe("post", () => {
        beforeEach(() => {
            // @ts-expect-error sendRequest is private method
            sendRequestSpy = jest.spyOn(providerRequestService, "sendRequest").mockResolvedValue({});
        });

        it("should call sendRequest Method", async () => {
            const url = "/test";
            const option = { headers: { test: true } };
            await providerRequestService.post(url, option);

            expect(sendRequestSpy).toBeCalledWith("POST", url, option);
        });
    });

    describe("createLog", () => {
        let repositoryCreateSpy: jest.SpyInstance;

        beforeAll(() => {
            repositoryCreateSpy = jest.spyOn(providerRequestRepository, "create").mockResolvedValue();
        });

        it("should call repository", async () => {
            const url = "/test";
            const date = new Date();
            const responseCode = 200;
            const type = "GET";

            // @ts-expect-error createlog is private method
            await providerRequestService.createLog(url, date, responseCode, type);

            expect(repositoryCreateSpy).toHaveBeenCalledWith({
                providerId,
                route: url,
                date,
                responseCode,
                type,
            });
        });
    });

    describe("sendRequest", () => {
        let createLogSpy: jest.SpyInstance;

        beforeEach(() => {
            // @ts-expect-error createLog is private method
            createLogSpy = jest.spyOn(providerRequestService, "createLog").mockResolvedValue({});

            (axios.request as jest.Mock).mockResolvedValue({ status: 200 });
        });

        it("should call axios request", async () => {
            const url = "/test";
            const method = "GET";
            const headers = {
                test: true,
            };

            // @ts-expect-error sendRequest is private method
            await providerRequestService.sendRequest(method, url, {
                headers,
            });

            expect(axios.request).toHaveBeenCalledWith({
                method,
                url,
                headers,
            });
        });

        it("should call createLog", async () => {
            const url = "/test";
            const method = "GET";
            const headers = {
                test: true,
            };

            // @ts-expect-error sendRequest is private method
            await providerRequestService.sendRequest(method, url, {
                headers,
            });

            expect(createLogSpy).toHaveBeenCalledWith(url, expect.any(Date), 200, method);
        });

        it("should call createLog when error", async () => {
            const url = "/test";
            const method = "GET";
            const headers = {
                test: true,
            };

            const statusCode = 400;

            (axios.request as jest.Mock).mockRejectedValueOnce({ status: statusCode });

            try {
                // @ts-expect-error sendRequest is private method
                await providerRequestService.sendRequest(method, url, {
                    headers,
                });
            } catch {
                expect(createLogSpy).toHaveBeenCalledWith(url, expect.any(Date), statusCode, method);
            }
        });
    });
});
