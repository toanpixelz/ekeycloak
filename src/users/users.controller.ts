import {
  Controller,
  Post,
  Body,
  Headers,
  Param,
  Delete,
  Put,
  Get,
} from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { UserRepresentation } from '../dto/keycloak/UserRepresentation';
import { Roles, Unprotected } from "nest-keycloak-connect";
import { CredentialRepresentation } from '../dto/keycloak/CredentialRepresentation';

@Controller('users')
export class UserController {
  constructor(private readonly keycloakService: KeycloakService) {}

  @Post()
  @Unprotected()
  async createUser(
    @Body() userRepresentation: UserRepresentation,
  ): Promise<void> {
    await this.keycloakService.createUser(userRepresentation);
  }

  @Put('/:id')
  async updateUser(
    @Body() userRepresentation: UserRepresentation,
    @Param('id') userId: string,
  ): Promise<void> {
    await this.keycloakService.updateUser(userId, userRepresentation);
  }

  @Get(':user-id')
  async getUser(@Param('user-id') userId: string): Promise<void> {
    await this.keycloakService.getUser(
      userId,
      await this.keycloakService.getToken(),
    );
  }

  @Put(':user-id/change-password')
  async changePassword(
    @Body() userRepresentation: CredentialRepresentation,
    @Param('user-id') userId: string,
  ): Promise<void> {
    await this.keycloakService.resetPassword(
      userId,
      userRepresentation,
      await this.keycloakService.getToken(),
    );
  }

  @Put(':username/forgot-password')
  @Unprotected()
  async forgotPassword(@Param('username') username: string): Promise<void> {
    await this.keycloakService.resetPasswordByEmail(username);
  }

  @Delete(':user-id')
  @Roles({roles: ["realm:admin"]})
  async deleteUser(@Param('user-id') userId: string): Promise<void> {
    await this.keycloakService.deleteUser(
      userId,
      await this.keycloakService.getToken(),
    );
  }


}
