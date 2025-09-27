import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppComponent } from './app.component';
import { BarraBusquedaComponent } from './Components/barra-busqueda/barra-busqueda.component';
import { PostsUsuarioComponent } from './Components/posts-usuario/posts-usuario.component';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { HeaderFooterComponent } from './Components/header-footer/header-footer.component';
import { DatosUsuarioComponent } from './Components/datos-usuario/datos-usuario.component';

@NgModule({
  declarations: [
    AppComponent,
    BarraBusquedaComponent,
    PostsUsuarioComponent,
    HeaderFooterComponent,
    DatosUsuarioComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
