import { CredentialRepresentation } from './CredentialRepresentation';

export class UserRepresentation {
  id?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  enabled?: boolean;
  credentials?: CredentialRepresentation[];
  attributes?: { [key: string]: any };
  realmRoles?: string[];
  clientRoles?: { [key: string]: any };
  groups?: string[];
  createdTimestamp?: number;
  serviceAccountClientId?: string;
}
