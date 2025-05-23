import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity('telemetry')
export class Telemetry {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    eventType: string;

    @Column('jsonb', { nullable: true })
    data: Record<string, any>;

    @Column({ nullable: true })
    userId: string;

    @Column({ nullable: true })
    deviceId: string;

    @CreateDateColumn()
    timestamp: Date;
} 