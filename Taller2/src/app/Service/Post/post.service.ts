import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Post } from 'src/app/Model/post';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private base = 'https://dummyjson.com';
  constructor(private http: HttpClient) { }

  /** Obtiene todos los posts de un usuario por su ID */
  getPostsByUserId(userId: number): Observable<Post[]> {
    // Endpoint de DummyJSON para posts de un usuario
    // https://dummyjson.com/users/{userId}/posts
    return this.http.get<{ posts: Post[] }>(`${this.base}/users/${userId}/posts`).pipe(
      map(res => res?.posts ?? []),
      catchError(() => of([]))
    );
  }
}
