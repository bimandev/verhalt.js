import VerhaltKey, { VerhaltKeyContent } from "../../lib/verhaltKey";
import VerhaltModel from "../../lib/verhaltModel";
import { keyIndex } from "./keyIndex";

const regex = /^([a-zA-Z][a-zA-Z0-9]*)?(?:\[(.*)\])?(\?)?$/;

export function keyContent(model : VerhaltModel, input : string) : VerhaltKeyContent {
    const match = input?.match(regex) ?? undefined;
    
    if (match) {
        const name = match[1];
        const index = match[2];        
        const nullable = match[3];


        return [name, index ? keyIndex(model, index) ?? undefined : undefined, nullable ? true : false];
    }

    return [undefined, undefined, undefined];
}