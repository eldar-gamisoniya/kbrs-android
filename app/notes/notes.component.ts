import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { action } from "ui/dialogs";
import { Color } from "color";
import { Page } from "ui/page";
import { View } from "ui/core/view";
import { SearchBar } from "ui/search-bar";
import { TextView } from "ui/text-view";
import { BackendService, alert, setHintColor } from "../shared";

@Component({
  selector: "gr-notes",
  templateUrl: "notes/notes.component.html",
  styleUrls: ["notes/notes-common.css"]
})
export class NotesComponent implements OnInit {
  isLoading = false;
  text: string;
  noteName: string = '';
  @ViewChild("searchBar") searchBar: ElementRef;

  constructor(private router: Router,
    private backendService: BackendService,
    private page: Page) {}

  ngOnInit() {
    this.page.actionBarHidden = true;
    this.page.className = "note-page";
  }

  async onSubmit() {
    try{
      this.text = null;
      this.showActivityIndicator();
      let searchBar = <View>this.searchBar.nativeElement;
      searchBar.android.clearFocus();
      this.text = await this.backendService.getNote(this.noteName);
      this.hideActivityIndicator();
    }
    catch(e) {
      alert(e.message || e.error || e);
      this.hideActivityIndicator();
    }      
  }

  getFromStorage() {
    try{
      let searchBar = <View>this.searchBar.nativeElement;
      searchBar.android.clearFocus();
      this.text = this.backendService.getNoteFromStorage(this.noteName);
    }
    catch(e){
      alert(e.message || e.error || e);
    }
  }

  async generateKeys() {
    try{
      this.showActivityIndicator();
      await this.backendService.generateKeys();
      this.hideActivityIndicator();
    }
    catch(e) {
      alert(e.message || e.error || e);
      this.hideActivityIndicator();
    }
  }

  showActivityIndicator() {
    this.isLoading = true;
  }
  hideActivityIndicator() {
    this.isLoading = false;
  }

  async showMenu() {
    let result = await action({
      message: "What would you like to do?",
      actions: ["Log Off"],
      cancelButtonText: "Cancel"
    });
    
    if (result === "Log Off") {
      this.logoff();
    }
  }

  logoff() {
    this.backendService.logoff();
    this.router.navigate(["/login"]);
  }
}
