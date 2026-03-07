/* oxlint-disable */
 
 
const objectToId = new WeakMap();
let nextId = 1;

function getId(obj) {
    if (obj === null) return 0;

    if (objectToId.has(obj)) {
      return objectToId.get(obj);
    }

    const id = nextId++;
    objectToId.set(obj, id);
    return id;
  }

export default {
    async Java_pl_zb3_freej2me_bridge_JSReference_getWeakObjectId(lib, obj) {
        return getId(obj);
    },
    async Java_pl_zb3_freej2me_bridge_JSReference_checkReferenceEquality(lib, obj, obj2) {
        return obj === obj2;
    },
}
