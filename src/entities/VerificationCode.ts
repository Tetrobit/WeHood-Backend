import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity()
export class VerificationCode {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    email: string;

    @Column()
    code: string;

    @CreateDateColumn()
    createdAt: Date;

    @Column({ default: false })
    isUsed: boolean;
} 