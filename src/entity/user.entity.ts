import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserGroup } from './usergroup.entity';
import { Authenticator } from './authenticator.entity';


@Entity('user')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({unique: true})
  email: string;

  @Column({unique: true})
  username: string;

  @Column()
  password: string;

  @Column({ nullable:true })
  avatar?: string;

  @ManyToOne(() => UserGroup, userGroup => userGroup.users)
  userGroup: UserGroup;

  @Column({ nullable: true })
  userGroupId: number;

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  currentChallenge: string | null;

  @OneToMany(() => Authenticator, authenticator => authenticator.user)
  authenticators: Authenticator[];
}
