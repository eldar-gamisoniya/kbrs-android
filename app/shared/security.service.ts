import { Injectable } from "@angular/core";

import { getString, setString } from "application-settings";

import { sha256 } from "nativescript-toolbox";

const privateKeyId = "privateKey";
const publicKeyId = "publicKey";
const halfSignKeyId = "halfSignKey";
const publicSignKeyId = "publicSignKey";

declare var org:any;
declare var Array:any;

@Injectable()
export class SecirityService {

  constructor(){
    java.security.Security.insertProviderAt(new org.spongycastle.jce.provider.BouncyCastleProvider(), 1)
    console.log("Provide inserted");
  }

  public sessionKey: string;
  public privateSignKey: string;
  public userStorageKey: string;

  private getFromStorage(key: string): string {
    return this.decryptSerpent(getString(key), this.userStorageKey, true);
  }
  private setToStorage(key: string, value: string) {
    setString(key, this.encryptSerpent(value, this.userStorageKey, true));
  }

  public saveNote(name: string, text: string){
    let bytes = new java.lang.String(text).getBytes("UTF-8");
    let hex = this.toBase16(bytes);
    setString(`Note-${name}`, hex);
  }
  public getNote(name: string): string {
    return this.decryptSerpent(getString(`Note-${name}`), this.userStorageKey, false);
  }

  public get privateKey(): string {
    return this.getFromStorage(privateKeyId);
  }
  public set privateKey(privateKey: string) {
    this.setToStorage(privateKeyId, privateKey);
  }

  public get halfSignKey(): string{
    return this.getFromStorage(halfSignKeyId);
  }
  public set halfSignKey(halfSignKey: string){
    this.setToStorage(halfSignKeyId, halfSignKey);
  }

  public get publicKey(): string {
    return this.getFromStorage(publicKeyId);
  }
  public set publicKey(publicKey: string) {
    this.setToStorage(publicKeyId, publicKey);
  }

  public get publicSignKey(): string {
    return this.getFromStorage(publicSignKeyId);
  }
  public set publicSignKey(publicSignKey: string) {
    this.setToStorage(publicSignKeyId, publicSignKey);
  }

  generateKeys() {
    let keyGen = java.security.KeyPairGenerator.getInstance("RSA");
    keyGen.initialize(2048);
    let keys = keyGen.genKeyPair();
    let res = {
      privateKey: this.toBase16(keys.getPrivate().getEncoded()),
      publicKey: this.toBase16(keys.getPublic().getEncoded())
    }
    return res;
  }

  generateRandomHexString(length: number) {
    let arr = Array.create("byte", length);
    new java.util.Random().nextBytes(arr);
    return this.toBase16(arr);
  }

  decryptKey(encrypted: string): string {
    let cipher = javax.crypto.Cipher.getInstance("RSA/ECB/PKCS1Padding");
    let privateKey = this.getRsaPrivateKey(this.privateKey);
    cipher.init(javax.crypto.Cipher.DECRYPT_MODE, privateKey);
    this.sessionKey = this.toBase16(cipher.doFinal(this.toByteArray(encrypted)));
    return this.sessionKey;
  }

  decryptSerpent(encrypted: string, keyStr: string, toBase16: boolean): string {
    let cipher = javax.crypto.Cipher.getInstance("SERPENT/CFB/PKCS7Padding");
    let keyArray = this.toByteArray(keyStr);
    let key = new javax.crypto.spec.SecretKeySpec(keyArray, "SERPENT");
    let arr = Array.create("byte", 16);
    const iv = new javax.crypto.spec.IvParameterSpec(arr);
    cipher.init(javax.crypto.Cipher.DECRYPT_MODE, key, iv); 
    let ans = cipher.doFinal(this.toByteArray(encrypted));
    let str:string = toBase16 ? this.toBase16(ans) : new java.lang.String(ans,"UTF-8").toString();
    return str;
  }

  encryptSerpent(decrypted: string, keyStr: string, toBase16: boolean): string {
    let cipher = javax.crypto.Cipher.getInstance("SERPENT/CFB/PKCS7Padding");
    let keyArray = this.toByteArray(keyStr);
    let key = new javax.crypto.spec.SecretKeySpec(keyArray, "SERPENT");
    let arr = Array.create("byte", 16);
    const iv = new javax.crypto.spec.IvParameterSpec(arr);
    cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, key, iv); 
    let ans = cipher.doFinal(this.toByteArray(decrypted));
    let str:string = toBase16 ? this.toBase16(ans) : new java.lang.String(ans,"UTF-8").toString();
    return str;
  }

  private toByteArray(key: string): any {
      let arr = Array.create("byte", key.length / 2);
      for (let i = 0; i < key.length; i += 2){
        arr[i / 2] = parseInt(key.substr(i, 2), 16);
      }
      return arr; 
  }

  private toBase16(key: any): string {
    let arr:Array<string> = [];
    for (let i = 0; i < key.length; i++) {
      arr.push(('0' + (key[i] & 0xFF).toString(16)).slice(-2));
    }
    return arr.join('');
  }

  public xorParts(firstPart: string, secondPart: string):string {
    console.log(`first: ${firstPart}
    second: ${secondPart}`);
    let first = this.toByteArray(firstPart);
    let second = this.toByteArray(secondPart);
    for (let i = 0; i < first.length; i++){
      first[i] ^= second[i];
    }
    return this.toBase16(first);
  }

  private getRsaPrivateKey(key: string):java.security.IPrivateKey {
    return java.security.KeyFactory.getInstance("RSA").generatePrivate(
      new java.security.spec.PKCS8EncodedKeySpec(this.toByteArray(key)));
  }

  public signData(data:string):string{
    let key = this.getRsaPrivateKey(this.privateSignKey);
    let instance = java.security.Signature.getInstance("SHA1withRSA");
    instance.initSign(key);
    instance.update(new java.lang.String(data).getBytes("UTF-8"));
    let bytes = instance.sign(); 
    let res = this.toBase16(bytes);
    return res;
  }

  public hashPassword(password:string):string{ 
    return sha256(password).toString();   
  } 

}
