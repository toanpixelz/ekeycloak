import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { UserRepresentation } from '../dto/keycloak/UserRepresentation';

@Injectable()
export class KeycloakService {
  private readonly keycloakUrl =
    'http://localhost:9082/admin/realms/nestjs-demo/users';

  private readonly keycloakLoginUrl =
    'http://localhost:9082/realms/nestjs-demo/protocol/openid-connect/token';
  private readonly clientId = 'admin-cli';
  private readonly clientSecret = 'SY188uaULvFe4axXUIUeN4MUBcfSdnnV';

  constructor(private readonly httpService: HttpService) {}

  async createUser(userRepresentation: UserRepresentation): Promise<void> {
    try {
      const token = await this.getToken();
      await firstValueFrom(
        this.httpService.post(this.keycloakUrl, userRepresentation, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }),
      );
    } catch (error) {
      console.log('create user exception ', error);
      throw new Error(`Failed to create user: ${error.message}`);
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
}
