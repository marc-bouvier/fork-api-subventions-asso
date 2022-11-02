import { RoleEnum } from "../../../../@enums/Roles";
import { CliStaticInterface } from "../../../../@types";
import { StaticImplements } from "../../../../decorators/staticImplements.decorator";
import userService from "../../user.service";

@StaticImplements<CliStaticInterface>()
export default class ConsumerCliController {
    static cmdName = "consumer"

    async create(email: string) {
        const result = await userService.signup(email, RoleEnum.consumer);

        if (!result.success) {
            console.info("Consumer user creation error : \n", result.message);
            return;
        }

        console.info("Consumer user has been created");
    }
}