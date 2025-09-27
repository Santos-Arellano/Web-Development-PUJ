// src/app/Service/User/user.service.ts
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { User } from 'src/app/Model/user';

@Injectable({ providedIn: 'root' })
export class UserService {
  private base = 'https://dummyjson.com';

  constructor(private http: HttpClient) {}

  /** Busca por username. Devuelve User | null */
  getUserByUsername(username: string): Observable<User | null> {
    const url = `${this.base}/users/filter?key=username&value=${(username)}`;
    return this.http.get<{ users: User[] }>(url).pipe(
      // Revisa si hay usuarios en res?.users?, .length para saber cuántos usuarios hay
      map(res => (res?.users?.length ? res.users[0] : null)),
      // Si hay error (p.ej. 404), devuelve null
      catchError(() => of(null))
    );
  }

}