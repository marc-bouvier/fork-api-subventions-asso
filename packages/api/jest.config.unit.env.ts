import { JEST_DATA_BRETAGNE_PASSWORD, JEST_DATA_BRETAGNE_USERNAME } from "./jest.config.env";

process.env.MAIL_USER = "test@datasubvention.fr";
process.env.JWT_SECRET = "FAKE_JWT_SECRET";
process.env.API_SENDINBLUE_CONTACT_LIST = "1";
process.env.API_SENDINBLUE_TOKEN = "FAKE_TOKEN";
process.env.DEMARCHES_SIMPLIFIEES_TOKEN = "FAKE_TOKEN";
process.env.ENV = "test";
process.env.DATA_BRETAGNE_USERNAME = JEST_DATA_BRETAGNE_USERNAME;
process.env.DATA_BRETAGNE_PASSWORD = JEST_DATA_BRETAGNE_PASSWORD;
process.env.AGENT_CONNECT_ENABLED = "true";


jest.mock("axios");
