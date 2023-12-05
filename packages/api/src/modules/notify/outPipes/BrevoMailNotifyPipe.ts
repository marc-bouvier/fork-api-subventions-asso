import Brevo from "@getbrevo/brevo";
import { NotificationType } from "../@types/NotificationType";
import { NotifyOutPipe } from "../@types/NotifyOutPipe";
import { LOG_MAIL, MAIL_USER } from "../../../configurations/mail.conf";
import { NotificationDataTypes } from "../@types/NotificationDataTypes";
import BrevoNotifyPipe from "./BrevoNotifyPipe";

export enum TemplateEnum {
    creation = 55,
    forgetPassword = 74,
    alreadySubscribed = 152,
}

export class BrevoMailNotifyPipe extends BrevoNotifyPipe implements NotifyOutPipe {
    accepts = [NotificationType.USER_CREATED, NotificationType.USER_FORGET_PASSWORD, NotificationType.TEST_EMAIL];

    private apiInstance: Brevo.TransactionalEmailsApi;

    constructor() {
        super();
        this.apiInstance = new Brevo.TransactionalEmailsApi();
    }

    notify(type, data) {
        switch (type) {
            case NotificationType.TEST_EMAIL:
                return this.sendTestMail(data);
            case NotificationType.USER_CREATED:
                return this.sendCreationMail(data);
            case NotificationType.USER_FORGET_PASSWORD:
                return this.sendForgetPasswordMail(data);
            case NotificationType.USER_CONFLICT:
                return this.sendAlreadySubscribed(data);
            default:
                return Promise.resolve(false);
        }
    }

    async sendTestMail(data: NotificationDataTypes[NotificationType.TEST_EMAIL]) {
        return this.sendMail(data.email, {}, data.templateId);
    }

    private async sendCreationMail(data: NotificationDataTypes[NotificationType.USER_CREATED]) {
        return this.sendMail(data.email, { url: data.url }, TemplateEnum.creation);
    }

    private async sendForgetPasswordMail(data: NotificationDataTypes[NotificationType.USER_FORGET_PASSWORD]) {
        return this.sendMail(data.email, { url: data.url }, TemplateEnum.forgetPassword);
    }

    private sendAlreadySubscribed(data: NotificationDataTypes[NotificationType.USER_CONFLICT]) {
        return this.sendMail(data.email, { email: data.email }, TemplateEnum.alreadySubscribed);
    }

    async sendMail(email: string, params: unknown, templateId: number): Promise<boolean> {
        const sendSmtpEmail = new Brevo.SendSmtpEmail();
        sendSmtpEmail.templateId = templateId;
        sendSmtpEmail.sender = { name: "Data.Subvention", email: MAIL_USER };
        sendSmtpEmail.params = params;
        sendSmtpEmail.to = [{ email: email }];
        sendSmtpEmail.bcc = [{ name: "Data.Subvention Log", email: LOG_MAIL }];

        try {
            await this.apiInstance.sendTransacEmail(sendSmtpEmail, {
                headers: {
                    "content-type": "application/json",
                },
            });
            return true;
        } catch (error) {
            return false;
        }
    }
}

const brevoMailNotifyPipe = new BrevoMailNotifyPipe();

export default brevoMailNotifyPipe;
