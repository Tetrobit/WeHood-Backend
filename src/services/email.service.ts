import nodemailer from 'nodemailer';
import { AppDataSource } from '../config/database';
import { VerificationCode } from '../entities/VerificationCode';

export class EmailService {
    private transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '1025'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER || 'example.com',
            pass: process.env.SMTP_PASSWORD || 'password',
        },
    });

    async sendVerificationCode(email: string): Promise<VerificationCode> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();

        const verificationCode = new VerificationCode();
        verificationCode.email = email;
        verificationCode.code = code;

        await AppDataSource.getRepository(VerificationCode).save(verificationCode);

        console.log("Sending code to", email);
        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@wehood.zenlog.ru',
            to: email,
            subject: 'Код подтверждения',
            text: `Ваш код подтверждения: ${code}`,
            html: `<p>Ваш код подтверждения: <strong>${code}</strong></p>`,
            sender: {
                name: 'Служба поддержки WeHood',
                address: 'noreply@wehood.zenlog.ru'
            }
        });
        console.log("Sended code to", email);

        return verificationCode;
    }
}

export default new EmailService();