import { createParamDecorator, SetMetadata, type ExecutionContext } from "@nestjs/common";

import type { AuthenticatedRequest, AuthenticatedUser } from "./auth.types";

export const IS_PUBLIC = "dceylon:is-public";
export const REQUIRED_ROLES = "dceylon:required-roles";

export const Public = () => SetMetadata(IS_PUBLIC, true);
export const Roles = (...roles: string[]) => SetMetadata(REQUIRED_ROLES, roles);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    if (!request.user) throw new Error("The authenticated user was not attached to the request.");
    return request.user;
  },
);
