import { Entity, Column, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { User } from './user.entity';
import type { AuthenticatorTransportFuture, Base64URLString, CredentialDeviceType } from '@simplewebauthn/server';

@Entity('authenticator')
export class Authenticator {
  @PrimaryColumn()
  id: string;

  @ManyToOne(() => User, user => user.authenticators)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  publicKey: string;

  @Column()
  webauthnUserID: Base64URLString;

  @Column()
  counter: number;

  @Column()
  deviceType: CredentialDeviceType;

  @Column()
  backup: boolean;

  @Column('nvarchar', { transformer: {
      to: (value: AuthenticatorTransportFuture[]) => JSON.stringify(value),
      from: (value: string) => JSON.parse(value)
    }})
  transports: AuthenticatorTransportFuture[];

}
