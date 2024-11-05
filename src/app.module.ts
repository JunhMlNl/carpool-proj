import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { TypeOrmModule } from "@nestjs/typeorm";
import { typeORMConfig } from "./configs/typeorm.config";
import { MailModule } from './mail/mail.module';
import { JwtConfigModule } from './jwt-config/jwt-config.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(typeORMConfig),
    AuthModule,
    MailModule,
    JwtConfigModule
  ],
})
export class AppModule {}