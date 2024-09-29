export interface RoleRepresentation {
  id: string;
  name: string;
  description: string;
  scopeParamRequired: boolean;
  composite: boolean;
  clientRole: boolean;
  containerId: string;
  attributes: Record<string, any>;
}
