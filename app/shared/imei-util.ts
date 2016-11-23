import * as utils from "utils/utils";
import * as application from "application"



export function getImei(): string {
    let manager = application.android.context.getSystemService(android.content.Context.TELEPHONY_SERVICE);
    let imei = manager.getDeviceId();
    return imei; 
} 