import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { User } from './User';
import { Poll } from './Poll';

@Entity()
export class PollVote {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @ManyToOne(() => Poll)
  @JoinColumn()
  poll: Poll;

  @Column()
  optionIndex: number;

  @CreateDateColumn()
  createdAt: Date;
} 