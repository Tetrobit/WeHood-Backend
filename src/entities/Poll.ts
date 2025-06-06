import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity()
export class Poll {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column('jsonb')
  options: {
    text: string;
    votes: number;
  }[];

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  image: string;
} 