import { VerhaltStep, VerhaltStepCatching, VerhaltStepContent, VerhaltStepDisplay, VerhaltStepForm, VerhaltStepStructure, VerhaltStepUseRedirect } from "@verhalt/types/lib";
import { validateStepName } from "./validateStepName";
import { validateStepIndex } from "./validateStepIndex";
import { CharInfo } from "../charInfo";
import { checkStep } from "./checkStep";

export function parseStep(input : string) : VerhaltStep | undefined {
    checkStep(input);
    return parseStepUnsafe(input);
}

export function parseStepUnsafe(input : string) : VerhaltStep | undefined {
    if (!input) return undefined;
    if (input.length === 0) return undefined;

    let form : VerhaltStepForm | undefined = undefined;
    let display : VerhaltStepDisplay | undefined = undefined;
    let content : VerhaltStepContent | undefined = undefined;
    let structure : VerhaltStepStructure | undefined = undefined;
    let catching : VerhaltStepCatching | undefined = undefined;
    let useRedirect : VerhaltStepUseRedirect | undefined = undefined;

    let bracketForm : "{}" | "[]" | undefined = undefined;
    let bracketDepth = 0;

    const contentBuffer : string[] = [];

    for(let ci = 0; ci < input.length; ci++) {
        const char = new CharInfo(input[ci]);
        contentBuffer.push(char.target);

        if(ci === 0) {
            if(char.isAlphabetic || char.target === "_") {
                form = "name";
                bracketForm = undefined;
            }
            else if(char.isCrulyOpenBracket) {
                form = "name";
                bracketForm = "{}";
            }
            else if (char.isSquareOpenBracket) {
                form = "index";
                bracketForm = "[]";
            }
            else {
                throw new Error("[VERHALT-STEP]: It must start with alphabetic character. " + char.target);
            }
        }

        if(char.isCrulyOpenBracket || char.isSquareOpenBracket) {
            if(!bracketForm) {
                throw new Error("[VERHALT-STEP]: Bracket is not defined.");
            }

            if(bracketForm.includes(char.target)) {
                if(bracketDepth === 0) {
                    contentBuffer.pop();
                }
    
                bracketDepth++;
            }
        }
        else if(char.isCrulyCloseBracket || char.isSquareCloseBracket) {
            if(!bracketForm) {
                throw new Error("[VERHALT-STEP]: Bracket is not defined.");
            }

            if(bracketForm.includes(char.target)) {
                if(bracketDepth === 1) {
                    if(!["?", "!", undefined].includes(input[ci + 1])) {
                        throw new Error("[VERHALT-STEP]: Unexpected character after closing bracket." + ci);
                    }
    
                    contentBuffer.pop();
                }

                bracketDepth--;
            }
        }
        else {
            if(bracketDepth === 0) {
                if(!(char.isAlphanumeric||char.target === "_")) {
                    if(char.isQuestionMark || char.isExclamationMark) {            
                        if(catching) {
                            throw new Error("[VERHALT-STEP]: Catching is already defined.");
                        }

                        catching = char.isQuestionMark ? "optional" : "strict";

                        if(!useRedirect)
                            useRedirect = false;
                    }
                    else if(char.isGreaterThanSign) {
                        if(useRedirect) {
                            throw new Error("[VERHALT-STEP]: Redirect is already defined.");
                        }

                        useRedirect = true;
                    }
                    else {
                        throw new Error("[VERHALT-STEP]: Unexpected character.");
                    }

                    contentBuffer.pop();
                }
            }
        }

        char[Symbol.dispose]();
    }

    display = input;
    content = contentBuffer.join("");
    catching ??= "native";
    useRedirect ??= false;

    if(form === "name") {
        structure = validateStepName(content) ? "static" : "variable";
    }
    else {
        structure = validateStepIndex(content) ? "static" : "variable";
    }

    if(form && display && structure && catching && (useRedirect !== undefined)) {
        return { form, display, content, structure, catching, useRedirect };
    }

    throw new Error("[VERHALT-STEP]: An error occurred while parsing step.");
}