import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { RoleMatchingMode, Roles } from 'nest-keycloak-connect';

@Controller('app')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Roles({ roles: ['realm:ADMIN'], mode: RoleMatchingMode.ANY })
  getHello(): string {
    console.log('logging')
    return this.appService.getHello();
  }
}
