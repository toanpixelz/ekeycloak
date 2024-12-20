// config/app.config.ts

export default () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  keycloak: {
    realm: process.env.KEYCLOAK_REALM || 'demo-realm',
    login_url:
      process.env.KEYCLOAK_LOGIN_URL ||
      'http://keycloak/realms/demo-realm/protocol/openid-connect/token',
  },
  keycloak_admin: {
    baseURL:
      process.env.KEYCLOAK_ADMIN_BASE_URL ||
      'http://keycloak/admin/realms/demo-realm',
    clientId: process.env.KEYCLOAK_ADMIN_CLIENT_ID || '',
    clientSecret: process.env.KEYCLOAK_ADMIN_CLIENT_SECRET || '',
    linkLifeSpan: process.env.KEYCLOAK_ADMIN_LINK_LIFESPAN || '88997',
    clientRedirectUrl:
      process.env.KEYCLOAK_ADMIN_REDIRECT_URL || 'http:localhost:4200',
  }
});
