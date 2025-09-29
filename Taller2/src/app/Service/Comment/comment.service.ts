import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Comment } from 'src/app/Model/comment';

@Injectable({
  providedIn: 'root'
})
export class CommentService {
  private base = 'https://dummyjson.com';
  constructor(private http: HttpClient) { }

  /** Obtiene todos los comentarios de un post por su ID */
  getCommentsByPostId(postId: number): Observable<Comment[]> {
    // Endpoint de DummyJSON para comentarios por id de post
    // https://dummyjson.com/posts/{postId}/comments o /comments/post/{postId}
    return this.http.get<{ comments: Comment[] }>(`${this.base}/posts/${postId}/comments`).pipe(
      map(res => res?.comments ?? []),
      catchError(() => of([]))
    );
  }
}
