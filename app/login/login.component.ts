import { Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { Router } from "@angular/router";
import { Color } from "color";
import { connectionType, getConnectionType } from "connectivity";
import { Animation } from "ui/animation";
import { View } from "ui/core/view";
import { prompt } from "ui/dialogs";
import { Page } from "ui/page";
import { TextField } from "ui/text-field";

import { alert, setHintColor, BackendService, User } from "../shared";

@Component({
  selector: "gr-login",
  templateUrl: "login/login.component.html",
  styleUrls: ["login/login-common.css", "login/login.component.css"],
})
export class LoginComponent implements OnInit {
  user: User;
  isAuthenticating = false;
  @ViewChild("initialContainer") initialContainer: ElementRef;
  @ViewChild("mainContainer") mainContainer: ElementRef;
  @ViewChild("formControls") formControls: ElementRef;
  @ViewChild("email") email: ElementRef;
  @ViewChild("password") password: ElementRef;

  constructor(private router: Router,
    private backendService: BackendService,
    private page: Page) {
    this.user = new User();
    this.user.email = "terrrevan@gmail.com"; 
    this.user.password = "Password123*";
  }

  async ngOnInit() {
    this.page.actionBarHidden = true;
  }

  focusPassword() {
    this.password.nativeElement.focus();
  }

  submit() {
    if (!this.user.isValidEmail()) {
      alert("Enter a valid email address.");
      return;
    }

    this.isAuthenticating = true;
    this.login();
  }

  async login() {
    if (getConnectionType() === connectionType.none) {
      alert("Notes requires an internet connection to log in.");
      return;
    }
    console.log("login started");
    try{
      await this.backendService.login(this.user);
      console.log("login ended");
      this.isAuthenticating = false;
      this.router.navigate(["/"]);
    }
    catch(e) {
      alert("Unfortunately we could not find your account.");
      this.isAuthenticating = false;
    }
  }

  startBackgroundAnimation(background) {
    background.animate({
      scale: { x: 1.0, y: 1.0 },
      duration: 10000
    });
  }

  async showMainContent() {
    let initialContainer = <View>this.initialContainer.nativeElement;
    let mainContainer = <View>this.mainContainer.nativeElement;
    let formControls = <View>this.formControls.nativeElement;
    let animations = [];

    // Fade out the initial content over one half second
    await initialContainer.animate({
      opacity: 0,
      duration: 500
    });
    // After the animation completes, hide the initial container and
    // show the main container and logo. The main container and logo will
    // not immediately appear because their opacity is set to 0 in CSS.
    initialContainer.style.visibility = "collapse";
    mainContainer.style.visibility = "visible";
    
    // Fade in the main container and logo over one half second.
    animations.push({ target: mainContainer, opacity: 1, duration: 500 });
    
    // Slide up the form controls and sign up container.
    animations.push({ target: formControls, translate: { x: 0, y: 0 }, opacity: 1, delay: 650, duration: 150 });

    // Kick off the animation queue
    new Animation(animations, false).play();
  }

  setTextFieldColors() {
    let emailTextField = <TextField>this.email.nativeElement;
    let passwordTextField = <TextField>this.password.nativeElement;

    let mainTextColor = new Color("black");
    emailTextField.color = mainTextColor;
    passwordTextField.color = mainTextColor;

    let hintColor = new Color("#ACA6A7");
    setHintColor({ view: emailTextField, color: hintColor });
    setHintColor({ view: passwordTextField, color: hintColor });
  }
}
