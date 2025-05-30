import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { Observable, tap } from 'rxjs';
import { AuthenticationResult } from '../../models/authenticationResult';
import { Credentials } from '../../models/credentials';
import { HttpClient } from '@angular/common/http';
import { settings } from '../settings.config';
import { RegistrationInformation } from '../../models/registrationInformation';
import { AuthenticatedUserInformation } from '../../models/authenticatedUserInformation';


@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {


  get authenticatedUser(): AuthenticatedUserInformation {
    return this.getUser() as AuthenticatedUserInformation;
  }
  
  public constructor(private http: HttpClient) {}

  public login(credentials: Credentials): Observable<AuthenticationResult> {
    return this.http.post<AuthenticationResult>(settings.apiRoute + '/Authentication/login', credentials).pipe(
      tap(result => {
        this.setToken(result.token)
        this.setUser(result.user)
      })
    );
  }
  public submitRegistration(information: RegistrationInformation): Observable<string> {
    return this.http.post<string>(settings.apiRoute + '/Registration/register-submit', information)
  }


  public logout(): void {
    sessionStorage.removeItem('token');
  }

  public isAuthenticated(): boolean {
    return !!this.getToken() && !!this.getUser();
  }


  public getToken(): string|null {
    return sessionStorage.getItem('token');
  }

  private setToken(token: string): void {
    sessionStorage.setItem('token', token);
  }

  private setUser(user: AuthenticatedUserInformation): void {
    sessionStorage.setItem('user', JSON.stringify(user));
  
  }
  public getUser(): User | null {
    const userString = sessionStorage.getItem('user');
    return userString ? JSON.parse(userString) as User : null;
  }

}
