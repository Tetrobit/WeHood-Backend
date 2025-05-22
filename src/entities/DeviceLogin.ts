import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class DeviceLogin {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ nullable: true })
    deviceName: string;

    @Column({ nullable: true })
    deviceType: string;

    @Column("jsonb", { nullable: true })
    deviceParams: Record<string, any>;

    @Column()
    refreshToken: string;

    @Column()
    accessToken: string;

    @Column()
    refreshTokenExpiresAt: Date;

    @Column()
    accessTokenExpiresAt: Date;

    @ManyToOne(() => User, user => user.deviceLogins)
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 