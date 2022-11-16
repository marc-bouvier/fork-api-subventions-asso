import UserDto from "@api-subventions-asso/dto/user/UserDto";
import { Filter, ObjectId } from "mongodb";
import db from "../../../shared/MongoConnection";
import User from "../entities/UserNotPersisted";
import UserDbo from "./dbo/UserDbo";

export enum UserRepositoryErrors {
    UPDATE_FAIL = 1
}

export class UserRepository {
    private readonly collection = db.collection<UserDbo>("users");

    async findByEmail(email: string) {
        const user = await this.collection.findOne({ email: email });
        if (!user) return null;
        return this.removeSecrets(user);
    }

    async find(query: Filter<User> = {}) {
        const dbos = await this.collection.find(query).toArray();
        return dbos.map(dbo => this.removeSecrets(dbo));
    }

    async findById(userId: ObjectId) {
        const user = await this.collection.findOne({ _id: userId });
        if (!user) return null;
        return this.removeSecrets(user);
    }

    async update(user: UserDbo | UserDto): Promise<UserDto> {
        if (user._id) await this.collection.updateOne({ _id: user._id }, { $set: user });
        else await this.collection.updateOne({ email: user.email }, { $set: user });
        return user;
    }

    async delete(user: UserDto): Promise<boolean> {
        const result = await this.collection.deleteOne({ _id: user._id });
        return result.acknowledged;
    }

    async create(user: User) {
        const userDbo = { ...user, _id: new ObjectId() }
        const result = await this.collection.insertOne(userDbo);
        return this.removeSecrets({ ...user, _id: result.insertedId });
    }

    async getUserWithSecretsByEmail(email: string): Promise<UserDbo | null> {
        return this.collection.findOne({ email });
    }

    async getUserWithSecretsById(id: ObjectId): Promise<UserDbo | null> {
        return this.collection.findOne({ _id: id });
    }

    private removeSecrets(user: UserDbo): UserDto | null {
        if (!user) return null;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { hashPassword, jwt, ...userWithoutSecret } = user;
        return userWithoutSecret
    }
}

const userRepository = new UserRepository();

export default userRepository;