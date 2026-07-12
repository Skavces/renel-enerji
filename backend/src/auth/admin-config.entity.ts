import { Column, Entity, PrimaryColumn } from 'typeorm'

@Entity('admin_config')
export class AdminConfig {
  @PrimaryColumn()
  id: number

  @Column({ nullable: true, type: 'text' })
  totpSecret: string | null

  @Column({ nullable: true, type: 'text' })
  username: string | null

  @Column({ nullable: true, type: 'text' })
  passwordHash: string | null

  // Şifre/kullanıcı adı değişiminde artar; eski JWT'ler (ver claim'i eşleşmeyen) geçersizleşir
  @Column({ default: 0 })
  tokenVersion: number
}
