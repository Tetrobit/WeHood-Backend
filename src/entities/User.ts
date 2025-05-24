import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import * as bcrypt from "bcryptjs";
import { DeviceLogin } from "./DeviceLogin";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, nullable: true })
  vkId: string;

  @Column({ nullable: true })
  avatar: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true})
  password: string;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @OneToMany(() => DeviceLogin, deviceLogin => deviceLogin.user)
  deviceLogins: DeviceLogin[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  async hashPassword() {
    this.password = await bcrypt.hashSync(this.password);
  }

  async comparePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
} 