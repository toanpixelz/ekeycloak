import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserRepresentation } from '../dto/keycloak/UserRepresentation';
import { CredentialRepresentation } from '../dto/keycloak/CredentialRepresentation';
import { RoleRepresentation } from '../dto/keycloak/RoleRepresentation';
import { ConfigService } from '@nestjs/config';
import { NewUser } from '../dto/user/new-user';
import { UpdateUser } from '../dto/user/update-user';

@Injectable()
export class KeycloakService {
  keycloakAdminUrl = this.configService.get<string>('keycloak_admin.baseURL');
  keycloakLoginUrl = this.configService.get<string>('keycloak.login_url');
  clientId = this.configService.get<string>('keycloak_admin.clientId');
  clientSecret = this.configService.get<string>('keycloak_admin.clientSecret');
  lifespan = this.configService.get<string>('keycloak_admin.linkLifeSpan');
  redirectUrl = this.configService.get<string>(
    'keycloak_admin.clientRedirectUrl',
  );

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {}

  async createUser(newUser: NewUser): Promise<void> {
    try {
      console.log('keycloakLoginUrl ' + this.keycloakLoginUrl);
      console.log('clientId ' + this.clientId);
      console.log('clientSecret ' + this.clientSecret);
      const token = await this.getToken();
      const credential = new CredentialRepresentation();
      credential.type = 'password';
      credential.value = newUser.password;
      credential.temporary = false;
      const userRepresentation = new UserRepresentation();
      userRepresentation.credentials = [credential];
      userRepresentation.username = newUser.username;
      userRepresentation.email = newUser.username;
      userRepresentation.firstName = newUser.firstName;
      userRepresentation.lastName = newUser.lastName;
      userRepresentation.enabled = true;
      userRepresentation.emailVerified = false;
      await firstValueFrom(
        this.httpService.post(
          `${this.keycloakAdminUrl}/users`,
          userRepresentation,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );

      const users = await this.getUsersByUserName(
        userRepresentation.username,
        token,
      );
      const user = users[0];
      await this.sendVerifyEmail(
        user.id,
        this.redirectUrl,
        this.lifespan,
        this.clientId,
        token,
      );
    } catch (error) {
      console.log('create user exception ', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUsersByUserName(
    username: string,
    token: string,
  ): Promise<UserRepresentation[]> {
    const url = `${this.keycloakAdminUrl}/users`;
    const params = new URLSearchParams({
      first: '0',
      max: '1',
      username,
    });

    try {
      const response = await firstValueFrom(
        this.httpService.get<UserRepresentation[]>(
          `${url}?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch users: ${error.message}`);
    }
  }

  async sendVerifyEmail(
    userId: string,
    redirect_uri: string,
    lifespan: string,
    client_id: string,
    token: string,
  ): Promise<void> {
    const url = `${this.keycloakAdminUrl}/users/${userId}/send-verify-email`;

    const params = new URLSearchParams({
      redirect_uri,
      lifespan,
      client_id,
    });

    try {
      await firstValueFrom(
        this.httpService.put(
          `${url}?${params.toString()}`,
          null, // PUT request with no body
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
    } catch (error) {
      console.log(
        `Failed to send verification email to user with ID ${userId}: ${error.message}`,
      );
    }
  }

  async getUser(userId: string, token: string): Promise<UserRepresentation> {
    const url = `${this.keycloakAdminUrl}/users/${userId}`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch user with ID ${userId}: ${error.message}`,
      );
    }
  }

  async updateUser(userId: string, updateUser1: UpdateUser): Promise<void> {
    const url = `${this.keycloakAdminUrl}/users/${userId}`;
    const token = await this.getToken();
    try {
      await firstValueFrom(
        this.httpService.put(url, updateUser1, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
    } catch (error) {
      throw new Error(
        `Failed to update user with ID ${userId}: ${error.message}`,
      );
    }
  }

  async resetPassword(
    userId: string,
    credentialRepresentation: CredentialRepresentation,
    token: string,
  ): Promise<UserRepresentation> {
    const url = `${this.keycloakAdminUrl}/users/${userId}/reset-password`;

    try {
      const response = await firstValueFrom(
        this.httpService.put(url, credentialRepresentation, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to reset password for user with ID ${userId}: ${error.message}`,
      );
    }
  }

  async deleteUser(userId: string, token: string): Promise<void> {
    const url = `${this.keycloakAdminUrl}/users/${userId}`;

    try {
      await firstValueFrom(
        this.httpService.delete(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
    } catch (error) {
      throw new Error(
        `Failed to delete user with ID ${userId}: ${error.message}`,
      );
    }
  }

  async getToken() {
    return await this.loginClient();
  }

  async loginClient(): Promise<string> {
    const formData = new URLSearchParams();
    formData.append('client_id', this.clientId);
    formData.append('client_secret', this.clientSecret);
    formData.append('grant_type', 'client_credentials');
    try {
      const response = await firstValueFrom(
        this.httpService.post(this.keycloakLoginUrl, formData.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }),
      );
      const { access_token } = response.data;
      return access_token;
    } catch (error) {
      throw new Error(`Client login failed: ${error.message}`);
    }
  }

  async resetPasswordByEmail(username: string): Promise<void> {
    const token = await this.getToken();
    const user = await this.getUsersByUserName(username, token);
    const url = `${this.keycloakAdminUrl}/users/${user[0].id}/reset-password-email`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUrl,
    });

    try {
      await firstValueFrom(
        this.httpService.put(
          `${url}?${params.toString()}`,
          null, // No body for this PUT request
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
    } catch (error) {
      throw new Error(
        `Failed to send password reset email to user with username ${username}: ${error.message}`,
      );
    }
  }

  async getRoleByName(
    roleName: string,
    token: string,
  ): Promise<RoleRepresentation> {
    const url = `${this.keycloakAdminUrl}/roles/${roleName}`;
    try {
      const response = await firstValueFrom(
        this.httpService.get<RoleRepresentation>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch role with name ${roleName}: ${error.message}`,
      );
    }
  }

  async assignRole(
    userId: string,
    keycloakRoles: RoleRepresentation[],
    token: string,
  ): Promise<void> {
    const url = `${this.keycloakAdminUrl}/users/${userId}/role-mappings/realm`;

    try {
      await firstValueFrom(
        this.httpService.post(
          url,
          keycloakRoles, // Request body containing roles
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        ),
      );
    } catch (error) {
      throw new Error(
        `Failed to assign roles to user with ID ${userId}: ${error.message}`,
      );
    }
  }

  async removeUserRoles(
    userId: string,
    keycloakRoles: RoleRepresentation[],
    token: string,
  ): Promise<void> {
    const url = `${this.keycloakAdminUrl}/users/${userId}/role-mappings/realm`;

    try {
      await firstValueFrom(
        this.httpService.delete(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          data: keycloakRoles, // Request body containing roles
        }),
      );
    } catch (error) {
      throw new Error(
        `Failed to de-assign roles from user with ID ${userId}: ${error.message}`,
      );
    }
  }

  async getUserRoles(
    userId: string,
    token: string,
  ): Promise<RoleRepresentation[]> {
    const url = `${this.keycloakAdminUrl}/users/${userId}/role-mappings/realm/available`;

    try {
      const response = await firstValueFrom(
        this.httpService.get<RoleRepresentation[]>(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
      return response.data;
    } catch (error) {
      throw new Error(
        `Failed to fetch available roles for user with ID ${userId}: ${error.message}`,
      );
    }
  }
}
