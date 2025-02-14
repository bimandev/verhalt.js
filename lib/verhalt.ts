import { routePaths, pathKeys, keyContent, keyIndex } from "@verhalt/parser/lib"
import { VerhaltArrayModel, VerhaltModel, VerhaltObjectModel, VerhaltReference, VerhaltReferenceEntry, VerhaltReferenceMatch, VerhaltStructureModel } from "@verhalt/types/lib";
import { pathError } from "./utils/error";

export class Verhalt {
    public static ref<TModel extends VerhaltObjectModel>(model : TModel, route : string, match : VerhaltReferenceMatch = "target") : VerhaltReference {
        if(route === undefined) {
            return [];
        }

        const matchListPlus = match === "list+";
        const matchList = matchListPlus || match === "list";
        const matchSource = !matchList && match === "source";

        const paths = routePaths(route);

        for(const path of paths) {
            try {                
                return fromPath(path);
            }
            catch(error) {
                if(paths[paths.length - 1] === path) {
                    throw error;
                }

                continue;
            }
        }

        return [];

        function fromPath(path? : string) : VerhaltReference {
            if(path === undefined) {
                return [];
            }
    
            let current = model;
            let source : VerhaltReferenceEntry | undefined = undefined;

            const keys = pathKeys(path);
            const completedKeys : string[]= [];
            const completedRefs : string[]= [];
            const ref : VerhaltReference = [];

            if(matchListPlus) {
                ref.push([":", model]);
            }
    
            while(keys.length > 0) {
                const key = keys.shift() as string;
                completedKeys.push(key);

                const [head, body] = keyContent(key);
                const [headNull, headName] = head ?? [false, undefined];
    
                if(headName) {
                    completedRefs.push(`${key[0]}${headName}`);

                    if(typeof current !== "object") {
                        throw pathError(completedRefs, `Expected object, got ${typeof current}`);
                    }
    
                    if(Array.isArray(current)) {
                        throw pathError(completedRefs, `Expected object, got array`);
                    }
    
                    if(!(headName in (current as object))) {
                        throw pathError(completedRefs, `Expected key ${headName} in object`);
                    }
    
                    if(matchSource) {
                        source = [headName, current];
                    }

                    current = (current as VerhaltStructureModel)[headName];

                    if(matchList) {
                        ref.push([completedRefs.join(""), current]);
                    }
                }
    
                if(body) {
                    for(let b = 0; b < body.length; b++) {
                        const [contentNull, contentValue] = body[b];
                        completedRefs.push(`[${contentValue}]`);

                        if(!Array.isArray(current)) {
                            throw pathError(completedRefs, `Expected array, got ${typeof current}`);
                        }
    
                        let index = keyIndex(contentValue);
    
                        if(index === null) {
                            throw pathError(completedRefs, `Expected index number, got ${typeof index}`);
                        }
    
                        if(typeof index === "string") {
                            
                            let value;
                            try {
                                //value = Verhalt.lookup(source, index);
                            }
                            catch(error) {
                                throw pathError(completedRefs, `Error during model lookup. \error:${error}`);
                            }
    
                            if(typeof value !== "number") {
                                throw pathError(completedRefs, `Expected number, got ${typeof value}`);
                            }
    
                            index = value;
                        }

                        if(matchSource) {
                            source = [index, current];
                        }

                        current = (current as VerhaltArrayModel)[index];

                        if(matchList) {
                            ref.push([completedRefs.join(""), current]);
                        }
                    }
                }
            }

            if(!matchList) {
                switch(match) {
                    case "target":
                        ref.push([completedKeys.join(""), current]);
                        break;
                    case "source":
                        ref.push([completedRefs[completedRefs.length - 1], source as VerhaltReferenceEntry]);
                        break;
                }
            }

            return ref;
        }
    }

    /*public static lookup<TModel extends VerhaltObjectModel>(source : TModel, route : string) : VerhaltModel {
        const [_, ref] = Verhalt.ref(source, route, "parent")[0] ?? [undefined, undefined];

        if(ref) {
            if(Array.isArray(ref)) {
                return ref[]
            }
        }

        return undefined;
    }*/
}

export default Verhalt;