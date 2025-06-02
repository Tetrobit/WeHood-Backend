import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, Geometry } from 'typeorm';
import { User } from './User';

@Entity('nearby_posts')
export class NearbyPost {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    title: string;

    @Column({ nullable: true })
    description: string;

    @Column('decimal', { precision: 10, scale: 8 })
    latitude: number;

    @Column('decimal', { precision: 10, scale: 8 })
    longitude: number;

    @Column({ type: 'geometry', spatialFeatureType: 'Point', srid: 4326, default: () => 'ST_SetSRID(ST_MakePoint(0, 0), 4326)' })
    location: Geometry;

    @ManyToOne(() => User)
    author: User;

    @Column('enum', { enum: ['image', 'video'], default: 'image' })
    type: 'image' | 'video';

    @Column()
    fileId: string;

    @Column({ default: 0 })
    views: number;

    @Column({ default: 0 })
    likes: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('nearby_comments')
export class NearbyComment {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    text: string;

    @ManyToOne(() => User)
    author: User;

    @ManyToOne(() => NearbyPost)
    post: NearbyPost;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity('nearby_likes')
export class NearbyLike {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User)
  user: User;

  @ManyToOne(() => NearbyPost)
  post: NearbyPost;

  @CreateDateColumn()
  createdAt: Date;
} 