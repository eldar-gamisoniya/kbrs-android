import { Injectable } from "@angular/core";

import { getString, setString } from "application-settings";

import { User } from "./user.model";

import { SecirityService } from "./security.service";
import { getImei } from "./imei-util";

import { connectionType, getConnectionType, startMonitoring } from "connectivity";
import * as http from "http";

const serverAddress = "http://192.168.0.101:9999";
const timeout = 9999;

@Injectable()
export class BackendService {
  imei = getImei();

  private token: string;

  get isLoggedIn(): boolean {
    return !!this.token;
  }

  private async makeRequest(url: string, method: "POST" | "GET", data: any): Promise<any>{
    data = data || {};
    data.random = java.util.UUID.randomUUID().toString();  
    let str = JSON.stringify(data);  
    let headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${this.token}`,
      "Imei": this.imei
    }
    if (!!this.securityService.privateSignKey) {
      headers["Signature"] = this.securityService.signData(str);
    }
    
    let options: http.HttpRequestOptions = {
      url: `${serverAddress}${url}`,
      method: method,
      timeout: timeout,
      headers: headers,
      content: str
    };
    let ans: any = await http.getJSON(options);
    if (ans && ans.message) 
      throw ans;
    return ans;
  }

  constructor(private securityService: SecirityService) {
  }

  async login(user: User) {
    try{
      let hashedPassword = this.securityService.hashPassword(user.password);
      console.log("hashed");
      let data = `grant_type=password&username=${user.email}&password=${hashedPassword}`;
      let options: http.HttpRequestOptions = {
        url: `${serverAddress}/Token`,
        method: "POST",
        timeout: timeout,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Imei": this.imei
        },
        content: data
      };
    
      let token:any = await http.getJSON(options);
      if (token.error != null)
        throw token.error;
      this.token = token.access_token;
      this.securityService.userStorageKey = token.userStorageKey;
      if (!!token.signHalfKey){
        console.log("sign half key exists");
        this.securityService.privateSignKey =  
          this.securityService.xorParts(this.securityService.halfSignKey, token.signHalfKey);
      } else { 
        let key1 = this.securityService.generateKeys();
        let signFirstPartKey = this.securityService.generateRandomHexString(key1.privateKey.length / 2);
        let signKey = key1.privateKey;
        let signPublicKey = key1.publicKey;
        let signSecondPartKey = this.securityService.xorParts(signKey, signFirstPartKey);
        let isSet = await this.makeRequest('/api/Account/SetSignatureKeys', "POST", {
          halfPrivateSignKey: signSecondPartKey,
          publicSignKey: signPublicKey
        });
        this.securityService.privateSignKey = signKey;
        this.securityService.publicSignKey = signPublicKey;
        this.securityService.halfSignKey = signFirstPartKey;
      }
      
      console.log("log in completed");
    }
    catch(e) {
      this.token = null;
      this.handleErrors(e);
      throw e;
    }
  }

  logoff() {
    this.token = "";
    this.securityService.sessionKey = null;
    this.securityService.privateSignKey = null;
  }

  async generateKeys() {

    let keys = this.securityService.generateKeys();
    this.securityService.privateKey = keys.privateKey;
    this.securityService.publicKey = keys.publicKey;
    try{
      let result = await this.makeRequest('/api/notes/refreshpublickey', "POST", {
        publicKey: this.securityService.publicKey
      });
      console.log("generate keys completed");
      return result;
    }
    catch(e) {
      this.handleErrors(e);
      throw e;
    }
  }

  async refreshSessionKey() {
    try{
      if (this.securityService.privateKey == null)
        throw "RSA keys not generated";
      let data = await this.makeRequest('/api/notes/refreshsessionkey', "POST", {});
      this.securityService.sessionKey = this.securityService.decryptKey(data.encryptedSessionKey);
      return this.securityService.sessionKey;
    }
    catch(e) {
      this.handleErrors(e);
      throw e;
    }
  }

  async getNote(name: string) {
    try{
      if (this.securityService.sessionKey == null)
        await this.refreshSessionKey();
      console.log("sessionkey");
      let data: any = await this.makeRequest('/api/notes', "POST", {
        name: name
      });
      if (data == null || data.encryptedText == null)
        throw(data.message || "Note not found");
      let ans = this.securityService.decryptSerpent(data.encryptedText, this.securityService.sessionKey, false);
      this.securityService.saveNote(name, ans);
      return ans;
    }
    catch(e) {
      this.handleErrors(e);
      throw e;
    }
  }

  getNoteFromStorage(name: string) {
    if (name == null)
      throw new Error("Empty name");
    let text = this.securityService.getNote(name);
    if (text == null)
      throw new Error("Note not found");
    return text;
  }

  handleErrors(error) {
    console.log(error);
    if (error.android){
      console.log(error.android);
      if (error.android.stackTrace)
        console.log(error.android.stackTrace);
      if (error.android.nativeException)
        console.log(error.android.nativeException);
    }
    if (typeof error == "object")
      console.log(JSON.stringify(error));
    else
      console.log(error);
  }
 
}
