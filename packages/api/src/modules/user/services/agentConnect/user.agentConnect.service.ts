import { FutureUserDto, UserWithJWTDto } from "dto";
import userRepository from "../../repositories/user.repository";
import userAuthService from "../auth/user.auth.service";
import notifyService from "../../../notify/notify.service";
import UserDbo from "../../repositories/dbo/UserDbo";
import { NotificationType } from "../../../notify/@types/NotificationType";
import { AgentConnectUser } from "../../@types/AgentConnectUser";
import userCrudService from "../crud/user.crud.service";
import { RoleEnum } from "../../../../@enums/Roles";
import { DuplicateIndexError } from "../../../../shared/errors/dbError/DuplicateIndexError";
import { InternalServerError } from "../../../../shared/errors/httpErrors";
import { removeHashPassword } from "../../../../shared/helpers/RepositoryHelper";
import configurationsService from "../../../configurations/configurations.service";

export class UserAgentConnectService {
    async login(agentConnectUser: AgentConnectUser): Promise<UserWithJWTDto> {
        // TODO fix uid vs agentConnectID
        if (!agentConnectUser.email) throw new InternalServerError("nope");
        const userWithSecrets: UserDbo | null = await userRepository.getUserWithSecretsByEmail(agentConnectUser.email);
        const isNewUser = !userWithSecrets;

        let user: Omit<UserDbo, "hashPassword"> = isNewUser
            ? await this.createUserFromAgentConnect(agentConnectUser)
            : removeHashPassword(userWithSecrets);

        if (!user.agentConnectId) user = await this.convertToAgentConnectUser(user, agentConnectUser);

        user = await userAuthService.updateJwt(user);
        // TODO ensure it's ok to keep user logged in longer

        notifyService.notify(NotificationType.USER_LOGGED, {
            email: user.email,
            date: new Date(),
        });

        return user as UserWithJWTDto;
    }

    private acUserToFutureUser(agentConnectUser: AgentConnectUser): FutureUserDto {
        const firstName = agentConnectUser.given_name.split(" ")[0];
        return {
            email: agentConnectUser.email,
            firstName,
            lastName: agentConnectUser.usual_name,
            roles: [RoleEnum.user],
            agentConnectId: agentConnectUser.uid,
        };
    }

    async createUserFromAgentConnect(agentConnectUser: AgentConnectUser): Promise<Omit<UserDbo, "hashPassword">> {
        const userObject = this.acUserToFutureUser(agentConnectUser);

        const domain = userObject.email.match(/.*@(.*)/)?.[1];
        if (!domain) throw new InternalServerError("email from AgentConnect invalid");
        await configurationsService.addEmailDomain(domain);

        return userCrudService.createUser(userObject, true).catch(e => {
            if (e instanceof DuplicateIndexError) {
                // should not happen but caught for extra safety
                notifyService.notify(NotificationType.USER_CONFLICT, userObject);
                throw new InternalServerError("An error has occurred");
            }
            throw e;
        }) as Promise<Omit<UserDbo, "hashPassword">>;
    }

    async convertToAgentConnectUser(user: Omit<UserDbo, "hashPassword">, agentConnectUser: AgentConnectUser) {
        const userFromAgentConnect = this.acUserToFutureUser(agentConnectUser);
        return userRepository.update(
            {
                ...user,
                ...userFromAgentConnect,
                active: true,
            },
            true,
        ) as Promise<UserWithJWTDto>;
    }
}

const userAgentConnectService = new UserAgentConnectService();
export default userAgentConnectService;
