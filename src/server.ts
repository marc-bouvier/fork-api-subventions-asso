import path from "path";
import express, { NextFunction, Request, Response } from "express";
import * as bodyParser from 'body-parser';
import * as swaggerUi from 'swagger-ui-express';
import passport from "passport"

import { RegisterRoutes } from "../tsoa/routes";
import { ValidateError } from "tsoa";
import { authMocks } from "./authentication/express.auth.hooks";

const appName = 'datasubvention';

export async function startServer(port = '8080', verbose = true) {
    port = process.env.PORT || port;
    const app = express();
    
    app.use("/assets", express.static(path.resolve(__dirname, '../assets')));
    app.use(bodyParser.urlencoded({
        extended: true
    }));
    app.use(bodyParser.json());
    app.use(passport.initialize());

    authMocks(app); // Passport Part


    RegisterRoutes(app); // TSOA Part

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    app.use('/docs', swaggerUi.serve, swaggerUi.setup(await import('../tsoa/swagger.json'), {
        customCss: '.swagger-ui .topbar { display: none }',
        customSiteTitle: "Data Subvention",
        customfavIcon: "/assets/images/favicons/favicon.ico"
    }));

    app.use(function errorHandler(
        err: unknown,
        req: Request,
        res: Response,
        next: NextFunction
    ): Response | void {
        if (err instanceof ValidateError) {
            console.warn(`Caught Validation Error for ${req.path}:`, err.fields);
            return res.status(422).json({
                success: false,
                message: "Validation Failed",
                details: err?.fields,
            });
        }
        if (err instanceof Error) {
            const statusCode = (err as unknown as { status: number}).status || 500;
            return res.status(statusCode).json({
                success: false,
                message: err.message,
            });
        }
        next();
    });

    return app.listen(port, () => {
        if (verbose) console.log(`${appName} listening at http://localhost:${port}`);
    });
}