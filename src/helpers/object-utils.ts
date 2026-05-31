const assign = Object.assign;

const defineProp = Object.getOwnPropertyDescriptor(Object, "defineProperty")?.value || Object.defineProperty;

const defineReadonly = <T, K extends keyof T>(object: T, prop: K, getter: () => T[K]): void => {
  defineProp(object, prop, { get: getter, enumerable: true, configurable: false });
};

const defineMethod = <T, K extends keyof T>(object: T, prop: K, method: T[K]): void => {
  defineProp(object, prop, { value: method, writable: false, enumerable: true, configurable: false });
};

const reflect = { get: Reflect.get, set: Reflect.set, delete: Reflect.deleteProperty };

const object = { assign, defineProp, defineReadonly, defineMethod };

export { reflect, object };
