import { ObjectId } from "mongodb";
import UniteLegalNameEntity from "../../../entities/UniteLegalNameEntity";
import UniteLegalNameDbo from "./UniteLegalNameDbo";

export default class UniteLegalNameAdapter {
    static toEntity(dbo: UniteLegalNameDbo): UniteLegalNameEntity {
        return new UniteLegalNameEntity(
            dbo.siren,
            dbo.name,
            dbo.searchingKey,
            dbo.updatedDate,
            dbo._id?.toString()
        )
    }

    static toDbo(entity: UniteLegalNameEntity): UniteLegalNameDbo {
        return {
            siren: entity.siren,
            name: entity.name,
            searchingKey: entity.searchingKey,
            updatedDate: entity.updatedDate,
            _id: new ObjectId(entity.id),
        }
    }
}