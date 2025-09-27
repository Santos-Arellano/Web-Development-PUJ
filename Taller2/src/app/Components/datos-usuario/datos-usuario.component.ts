// src/app/Components/Usuario/datos-usuario/datos-usuario.component.ts
import { Component, Input } from '@angular/core';
import { User } from 'src/app/Model/user';

@Component({
  selector: 'app-datos-usuario',
  templateUrl: './datos-usuario.component.html',
  styleUrls: ['./datos-usuario.component.css']
})
export class DatosUsuarioComponent {
  @Input() 
  usuario!: User | null;  // El padre (barra-busqueda o app) pasa el usuario encontrado
}