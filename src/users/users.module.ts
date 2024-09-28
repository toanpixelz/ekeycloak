import { Module } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { UserController } from './users.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  providers: [KeycloakService],
  exports: [KeycloakService],
  controllers: [UserController],
  imports: [HttpModule],
})
export class UsersModule {}
