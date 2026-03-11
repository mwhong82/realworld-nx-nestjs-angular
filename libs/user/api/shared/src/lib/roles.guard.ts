import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ROLES_KEY } from './roles';

@Injectable()
export class RolesGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    const acceptedRoles = this.reflector.get<string[]>(
      ROLES_KEY,
      context.getHandler()
    );
    if (!acceptedRoles) {
      return true;
    }
    const request = context.switchToHttp().getRequest();
    if (!request.user) {
      return false;
    }

    const userRole = request.user.role;
    return acceptedRoles.includes(userRole);
  }
}
