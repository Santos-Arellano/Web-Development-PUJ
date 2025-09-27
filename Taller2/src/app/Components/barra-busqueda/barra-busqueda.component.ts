// src/app/Components/Busqueda/barra-busqueda/barra-busqueda.component.ts
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { User } from 'src/app/Model/user';
import { UserService } from 'src/app/Service/User/user.service';

@Component({
  selector: 'app-barra-busqueda',
  templateUrl: './barra-busqueda.component.html',
  styleUrls: ['./barra-busqueda.component.css']
})
export class BarraBusquedaComponent {
  
  constructor(private userService: UserService) {}

  //Atributos
  searchQuery: string = '';  // Para el input de búsqueda
  usuarioEncontrado: User | null = null;  // Usuario encontrado
  loading: boolean = false;  // Para mostrar estado de carga
  errorMsg: string = '';  // Para mostrar errores

  //Métodos
  buscarUsuario(){
    if (!this.searchQuery.trim()) {
      this.errorMsg = 'Por favor ingresa un username';
      return;
    }

    this.loading = true;
    this.errorMsg = '';
    this.usuarioEncontrado = null;

    this.userService.getUserByUsername(this.searchQuery).subscribe({
      next: (user: User | null) => {
        this.loading = false;
        // Si usuario no es null
        if (user) {
          this.usuarioEncontrado = user;
          this.errorMsg = '';
        // Si el usuario no se encontró es decir es null
        } else {
          this.usuarioEncontrado = null;
          this.errorMsg = `No se encontró el usuario "${this.searchQuery}"`;
        }
      },
      error: (error) => {
        this.loading = false;
        this.usuarioEncontrado = null;
        this.errorMsg = 'Error al buscar el usuario. Inténtalo de nuevo.';
        console.error('Error:', error);
      }
    });
  }

  limpiarBusqueda() {
    this.searchQuery = '';
    this.usuarioEncontrado = null;
    this.errorMsg = '';
  }
}
