import nodemailer from 'nodemailer';
import { AppDataSource } from '../config/database';
import { VerificationCode } from '../entities/VerificationCode';

export class EmailService {
    private transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '1025'),
        secure: false,
    });

    async sendVerificationCode(email: string): Promise<string> {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        const verificationCode = new VerificationCode();
        verificationCode.email = email;
        verificationCode.code = code;
        
        await AppDataSource.getRepository(VerificationCode).save(verificationCode);

        await this.transporter.sendMail({
            from: process.env.SMTP_FROM || 'noreply@wehood.com',
            to: email,
            subject: 'Код подтверждения',
            text: `Ваш код подтверждения: ${code}`,
            html: `<p>Ваш код подтверждения: <strong>${code}</strong></p>`,
        });

        return code;
    }

    async verifyCode(email: string, code: string): Promise<boolean> {
        const verificationCode = await AppDataSource.getRepository(VerificationCode)
            .findOne({
                where: {
                    email,
                    code,
                    isUsed: false
                },
                order: {
                    createdAt: 'DESC'
                }
            });

        if (!verificationCode) {
            return false;
        }

        verificationCode.isUsed = true;
        await AppDataSource.getRepository(VerificationCode).save(verificationCode);
        
        return true;
    }
} 