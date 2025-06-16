import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('threads')
export class Thread {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('jsonb', { default: [] })
    messages: Array<any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
} 