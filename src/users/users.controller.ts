import { Controller, Post, Body, Headers } from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { UserRepresentation } from '../dto/keycloak/UserRepresentation';
import { Unprotected } from 'nest-keycloak-connect';

@Controller('users')
export class UserController {
  constructor(private readonly keycloakService: KeycloakService) {}

  @Post()
  @Unprotected()
  async createUser(
    @Body() userRepresentation: UserRepresentation
  ): Promise<void> {
    await this.keycloakService.createUser(userRepresentation);
  }
}
