import { ModuleWithProviders }  from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { NotesComponent } from "./notes.component";
import { AuthGuard } from "../auth-guard.service";

const notesRoutes: Routes = [
  { path: "notes", component: NotesComponent, canActivate: [AuthGuard] },
];
export const notesRouting: ModuleWithProviders = RouterModule.forChild(notesRoutes);