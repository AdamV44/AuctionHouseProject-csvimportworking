import { AuthenticatedUserInformation } from "./authenticatedUserInformation";
import { User } from "./user";
export class AuthenticationResult {
    token: string;
    user: AuthenticatedUserInformation;
}