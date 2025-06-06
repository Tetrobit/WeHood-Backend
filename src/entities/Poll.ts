import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';
import { NearbyPost } from './Nearby';

@Entity('polls')
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

  @Column({ nullable: true })
  image: string;

  @ManyToOne(() => User)
  @JoinColumn()
  createdBy: User;

  @ManyToOne(() => NearbyPost)
  @JoinColumn()
  post: NearbyPost;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ nullable: true })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;
}

@Entity('poll_votes')
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