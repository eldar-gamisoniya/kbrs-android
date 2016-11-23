import { NativeScriptModule } from "nativescript-angular/platform";
import { NgModule } from "@angular/core";
import { NativeScriptRouterModule } from "nativescript-angular/router";

import { authProviders, appRoutes } from "./app.routing";
import { AppComponent } from "./app.component";
import { setStatusBarColors, BackendService, SecirityService } from "./shared";

import { LoginModule } from "./login/login.module";
import { NotesModule } from "./notes/notes.module";
require("./shared/asynctest");

setStatusBarColors();

@NgModule({
  providers: [
    BackendService,
    SecirityService,
    authProviders
  ],
  imports: [
    NativeScriptModule,
    NativeScriptRouterModule,
    NativeScriptRouterModule.forRoot(appRoutes),
    LoginModule,
    NotesModule,
  ],
  declarations: [
      AppComponent,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
