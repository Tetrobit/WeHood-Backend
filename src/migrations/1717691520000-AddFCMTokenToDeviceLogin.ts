import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFCMTokenToDeviceLogin1717691520000 implements MigrationInterface {
    name = 'AddFCMTokenToDeviceLogin1717691520000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_login" ADD "fcmToken" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "device_login" DROP COLUMN "fcmToken"`);
    }
} 