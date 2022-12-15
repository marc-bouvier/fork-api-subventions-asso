import { Siret, Rna, Siren } from "dto";
import Provider from "../../providers/@types/IProvider";
import { Document } from "dto/search/Document";

export default interface DocumentProvider extends Provider {
    isDocumentProvider: boolean;

    getDocumentsBySiren(siren: Siren): Promise<Document[] | null>;
    getDocumentsBySiret(siret: Siret): Promise<Document[] | null>;
    getDocumentsByRna(rna: Rna): Promise<Document[] | null>;
}
