import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Post } from 'src/app/Model/post';
import { User } from 'src/app/Model/user';
import { PostService } from 'src/app/Service/Post/post.service';
import { CommentService } from 'src/app/Service/Comment/comment.service';
import { Comment } from 'src/app/Model/comment';

@Component({
  selector: 'app-posts-usuario',
  templateUrl: './posts-usuario.component.html',
  styleUrls: ['./posts-usuario.component.css']
})
export class PostsUsuarioComponent implements OnChanges {
  @Input() usuario!: User | null;

  cargando = false;
  errorMsg = '';
  posts: Post[] = [];
  comentariosPorPost: Record<number, Comment[]> = {};

  constructor(
    private postService: PostService,
    private commentService: CommentService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('usuario' in changes) {
      const current: User | null = changes['usuario'].currentValue;
      if (current && current.id) {
        this.cargarPostsDelUsuario(current.id);
      } else {
        // limpiar si no hay usuario
        this.posts = [];
        this.comentariosPorPost = {};
      }
    }
  }

  private cargarPostsDelUsuario(userId: number) {
    this.cargando = true;
    this.errorMsg = '';
    this.posts = [];
    this.comentariosPorPost = {};

    this.postService.getPostsByUserId(userId).subscribe({
      next: (posts) => {
        this.posts = posts;
        this.cargando = false;
        // cargar comentarios por cada post
        posts.forEach(p => this.cargarComentarios(p.id));
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = 'Error cargando posts del usuario.';
        this.cargando = false;
      }
    });
  }

  private cargarComentarios(postId: number) {
    this.commentService.getCommentsByPostId(postId).subscribe({
      next: (comments) => {
        this.comentariosPorPost[postId] = comments;
      },
      error: (err) => {
        console.error(err);
        this.comentariosPorPost[postId] = [];
      }
    });
  }
}
