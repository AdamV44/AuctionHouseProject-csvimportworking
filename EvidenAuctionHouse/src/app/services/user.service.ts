import { Injectable } from '@angular/core';
import { User } from '../../models/user';
import { Observable, of } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { settings } from '../settings.config';
import { Credentials } from '../../models/credentials';
import { AuthenticationResult } from '../../models/authenticationResult';
import { ChangePasswordDTO } from '../../models/changePasswordDTO';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor(private http: HttpClient) { }

  public getUserById(userId: string): Observable<User> {
    return this.http.get<User>(settings.apiRoute + '/users/get/' + userId)
  }
  public getMe(): Observable<User> {
    return this.http.get<User>(settings.apiRoute + '/users/me')
  }
  public acceptRules(): Observable<any> {
    return this.http.post<any>(settings.apiRoute + '/users/accept-rules', {})
  }
  public login(credentials: Credentials): Observable<AuthenticationResult> {
    return this.http.post<AuthenticationResult>(settings.apiRoute + '/users/login', credentials)
  }
  public changePassword(passwordChangeInfo: ChangePasswordDTO): Observable<string> {
    return this.http.post<string>(settings.apiRoute + '/users/change-password', passwordChangeInfo)
  }

}

  // public getUserById(userId: string): Observable<User> {
  //   const result: User[] = this.users.filter(user => user.id === userId)
  //   if (result.length > 1) {
  //     console.error("there is more than one user with id: " + userId);
  //   }
  //   return of(result[0]);

  // }

  // users: User[] = [
  //   new User("0", 'admin', '', '', true),
  //   new User("1", 'Adam Novák', 'adam.novak@example.com', 'heslo123', true),
  //   new User("2", 'Eva Svobodová', 'eva.svobodova@example.com', 'tajneheslo', false),
  //   new User("3", 'Petr Dvořák', 'petr.dvorak@example.com', 'mojeheslo', false),
  //   new User("4", 'Jana Černá', 'jana.cerna@example.com', 'janaheslo', false),
  //   new User("5", 'Admin Admin', 'admin@example.com', 'admin', true)
  // ];
  

