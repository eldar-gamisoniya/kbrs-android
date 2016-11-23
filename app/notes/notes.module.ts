import { NativeScriptModule } from "nativescript-angular/platform";
import { NativeScriptFormsModule } from "nativescript-angular/forms";
import { NgModule } from "@angular/core";
import { notesRouting } from "./notes.routing";
import { NotesComponent } from "./notes.component";

@NgModule({
  imports: [
    NativeScriptModule,
    NativeScriptFormsModule,
    notesRouting
  ],
  declarations: [
    NotesComponent
  ]
})
export class NotesModule {}
