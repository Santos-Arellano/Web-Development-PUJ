// src/app/Components/Layout/header-footer/header-footer.component.ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-header-footer',
  templateUrl: './header-footer.component.html',
  styleUrls: ['./header-footer.component.css'] 
})
export class HeaderFooterComponent {
  // Estado de navegación activa
  active: 'usuarios' | 'publicaciones' | 'buscar' = 'buscar';

  // Notificaciones simples
  showNotifications = false;
  notifications: { id: number; text: string }[] = [
    { id: 1, text: 'Nuevo comentario en uno de tus posts' },
    { id: 2, text: 'Tu perfil fue visto 5 veces hoy' },
    { id: 3, text: 'Tienes 2 nuevas reacciones' }
  ];

  get notificationsCount(): number {
    return this.notifications.length;
  }

  // Scroll suave a secciones de la página
  scrollTo(sectionId: string): void {
    if (sectionId === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  setActive(link: 'usuarios' | 'publicaciones' | 'buscar'): void {
    this.active = link;
    this.showNotifications = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }

  markNotificationsAsRead(): void {
    this.notifications = [];
    this.showNotifications = false;
  }
}
