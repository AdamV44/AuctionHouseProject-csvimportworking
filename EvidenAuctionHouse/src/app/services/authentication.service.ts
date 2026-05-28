import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { Observable, tap, BehaviorSubject, of } from 'rxjs';
import { map } from 'rxjs/operators';
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

  private userSubject = new BehaviorSubject<User | null>(this.getUser());
  public user$ = this.userSubject.asObservable();

  get authenticatedUser(): AuthenticatedUserInformation {
    return this.getUser() as AuthenticatedUserInformation;
  }
  
  public constructor(private http: HttpClient) {}

  public login(credentials: Credentials): Observable<AuthenticationResult> {
    // include credentials so server can set HttpOnly refresh cookie if implemented
    return this.http.post<AuthenticationResult>(settings.apiRoute + '/Authentication/login', credentials, { withCredentials: true }).pipe(
      tap(result => {
        // server may return token under different property names (token/accessToken)
        const anyRes: any = result as any;
        const token = anyRes?.accessToken ?? anyRes?.token ?? anyRes?.Token ?? null;
        if (token) {
          this.setToken(token);
        }
        if (anyRes?.user) {
          this.setUser(anyRes.user);
          this.userSubject.next(anyRes.user);
        }
        // fetch full profile (includes acceptedRules) and update stored user
        try {
          this.http.get<any>(settings.apiRoute + '/users/me').subscribe({
            next: (full) => {
              if (full) {
                this.setUser(full);
                this.userSubject.next(full);
              }
            },
            error: () => {
              // ignore
            }
          });
        } catch {
          // ignore
        }
      })
    );
  }
  public submitRegistration(information: RegistrationInformation): Observable<string> {
    return this.http.post<string>(settings.apiRoute + '/Registration/register-submit', information)
  }


  public logout(): void {
    // call server logout to clear refresh cookie, then clear local storage
    try {
      this.http.post(settings.apiRoute + '/Authentication/logout', {}, { withCredentials: true }).subscribe({
        next: _ => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.userSubject.next(null);
        },
        error: _ => {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          this.userSubject.next(null);
        }
      });
    }
    catch {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      this.userSubject.next(null);
    }
  }

  public isAuthenticated(): boolean {
  return !!this.getToken() && !!this.getUser();
  }

  public isAdmin(): boolean {
    return this.getUser()?.isAdmin === true;
  }


  public getToken(): string|null {
  return localStorage.getItem('token');
  }

  private setToken(token: string): void {
  if (!token) return;
  const normalized = token.startsWith('Bearer ') ? token.substring(7) : token;
  localStorage.setItem('token', normalized);
  }

  private setUser(user: AuthenticatedUserInformation): void {
  localStorage.setItem('user', JSON.stringify(user));
  
  }
  public updateUser(user: AuthenticatedUserInformation): void {
    this.setUser(user);
    this.userSubject.next(user);
  }

  public getUser(): User | null {
    const userString = localStorage.getItem('user');
    return userString ? JSON.parse(userString) as User : null;
  }

  // Attempt to refresh access token using server-side refresh cookie. Returns observable<boolean>.
  public refresh(): Observable<boolean> {
    return this.http.post<{ accessToken?: string, user?: AuthenticatedUserInformation }>(settings.apiRoute + '/Authentication/refresh', {}, { withCredentials: true }).pipe(
      tap(resp => {
        const anyResp: any = resp as any;
        const token = anyResp?.accessToken ?? anyResp?.token ?? anyResp?.Token ?? null;
        if (token) {
          this.setToken(token);
        }
        if (anyResp?.user) {
          this.setUser(anyResp.user);
          this.userSubject.next(anyResp.user);
        }
      }),
      // map to boolean success
      // if server provides accessToken, consider it success
      // otherwise false
      // catch will be handled by caller
      // Note: using map requires import from rxjs/operators but RxJS map is available via 'map' import
      map((resp) => !!(resp && resp.accessToken))
    );
  }

}
