import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserRepresentation } from '../dto/keycloak/UserRepresentation';
import { CredentialRepresentation } from '../dto/keycloak/CredentialRepresentation';

@Injectable()
export class KeycloakService {
  private readonly keycloakAdminUrl =
    'http://localhost:9082/admin/realms/nestjs-demo';

  private readonly keycloakLoginUrl =
    'http://localhost:9082/realms/nestjs-demo/protocol/openid-connect/token';
  private readonly clientId = 'admin-cli';
  private readonly clientSecret = 'SY188uaULvFe4axXUIUeN4MUBcfSdnnV';
  private readonly lifespan = '88997';
  private readonly redirectUrl = 'http:localhost:3000';

  constructor(private readonly httpService: HttpService) {}

  async createUser(userRepresentation: UserRepresentation): Promise<void> {
    try {
      const token = await this.getToken();
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

      let users = await  this.getUsersByUserName(userRepresentation.username,token);
      let user  = users[0];
      await this.sendVerifyEmail(user.id,this.redirectUrl,this.lifespan,this.clientId,token);
    } catch (error) {
      console.log('create user exception ', error);
      throw new Error(`Failed to create user: ${error.message}`);
    }
  }

  async getUsersByUserName(
    username: string,
    token: string
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
      console.log(`Failed to send verification email to user with ID ${userId}: ${error.message}`)
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

  async updateUser(
    userId: string,
    userRepresentation: UserRepresentation,
    token: string,
  ): Promise<void> {
    const url = `${this.keycloakAdminUrl}/users/${userId}`;

    try {
      await firstValueFrom(
        this.httpService.put(url, userRepresentation, {
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

  private async getToken() {
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

  async resetPasswordViaEmail(
    userId: string,
    clientId: string,
    redirectUri: string,
    token: string,
  ): Promise<void> {
    const url = `${this.keycloakAdminUrl}/users/${userId}/reset-password-email`;

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
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
        `Failed to send password reset email to user with ID ${userId}: ${error.message}`,
      );
    }
  }
}
