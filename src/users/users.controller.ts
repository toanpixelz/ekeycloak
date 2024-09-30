import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { KeycloakService } from './keycloak.service';
import { UserRepresentation } from '../dto/keycloak/UserRepresentation';
import { Roles, Unprotected } from 'nest-keycloak-connect';
import { CredentialRepresentation } from '../dto/keycloak/CredentialRepresentation';
import { ApiBearerAuth } from '@nestjs/swagger';

@Controller('users')
@ApiBearerAuth()
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

  @Get(':id')
  async getUser(@Param('id') userId: string): Promise<void> {
    await this.keycloakService.getUser(
      userId,
      await this.keycloakService.getToken(),
    );
  }

  @Put(':id/change-password')
  async changePassword(
    @Body() userRepresentation: CredentialRepresentation,
    @Param('id') userId: string,
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

  @Delete(':id')
  @Roles({ roles: ['realm:admin'] })
  async deleteUser(@Param('id') userId: string): Promise<void> {
    await this.keycloakService.deleteUser(
      userId,
      await this.keycloakService.getToken(),
    );
  }
}
