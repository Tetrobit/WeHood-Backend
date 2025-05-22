import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class DeviceLogin {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    deviceName: string;

    @Column()
    deviceType: string;

    @Column("jsonb", { nullable: true })
    deviceParams: Record<string, any>;

    @Column({ nullable: true })
    refreshToken: string;

    @Column({ nullable: true })
    accessToken: string;

    @Column({ nullable: true })
    refreshTokenExpiresAt: Date;

    @ManyToOne(() => User, user => user.deviceLogins)
    user: User;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
} 