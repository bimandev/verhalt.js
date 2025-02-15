import { isStepNameUnsafe } from "./isStepName";

export function checkStepName(input : string) {
    if(typeof input !== "string") throw new Error("[VERHALT-STEP]: Step name must be string");
    checkStepNameUnsafe(input);
}

export function checkStepNameUnsafe(input : string) : void {
    if(!isStepNameUnsafe(input)) throw new Error("[VERHALT-STEP]: Step name is invalid");
}