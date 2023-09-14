//从egret引擎移植过来的 执行对super的setter操作
//例如 ClassSon 覆盖了 ClassSuper 的 set a(value:number), superSetter(ClassSuper, son, "a", 100) 可以实现调用原始的 set a()

import { DEBUG } from "cc/env";


export function superSetter(currentClass: any, thisObj: any, type: string, value: any) {
    var cla = currentClass.prototype;
    var seters;
    if (!currentClass.hasOwnProperty("__sets__")) {
        Object.defineProperty(currentClass, "__sets__", { "value": {} });
    }
    seters = currentClass["__sets__"];
    var setF = seters[type];
    if (setF) {
        return setF.call(thisObj, value);
    }
    var d = Object.getPrototypeOf(cla);
    if (d == null) {
        return;
    }
    while (!d.hasOwnProperty(type)) {
        d = Object.getPrototypeOf(d);
        if (d == null) {
            return;
        }
    }
    setF = Object.getOwnPropertyDescriptor(d, type).set;
    seters[type] = setF;
    setF.call(thisObj, value);
}


//从egret引擎移植过来的 执行对super的getter操作
//例如 ClassSon 覆盖了 ClassSuper 的 get a():number时  superGetter(ClassSuper, son, "a") 可以实现调用原始的 get a()
export function superGetter(currentClass: any, thisObj: any, type: string) {
    var cla = currentClass.prototype;
    var geters;
    if (!currentClass.hasOwnProperty("__gets__")) {
        Object.defineProperty(currentClass, "__gets__", { "value": {} });
    }
    geters = currentClass["__gets__"];
    var getF = geters[type];
    if (getF) {
        return getF.call(thisObj);
    }
    var d = Object.getPrototypeOf(cla);
    if (d == null) {
        return;
    }
    while (!d.hasOwnProperty(type)) {
        d = Object.getPrototypeOf(d);
        if (d == null) {
            return;
        }
    }
    getF = Object.getOwnPropertyDescriptor(d, type).get;
    geters[type] = getF;
    return getF.call(thisObj);
}

/**动态获得一个类型中定义的setter 方便重新写扩展*/
export function getSetter(currentClass: any, type: string): any {
    let setter = Object.getOwnPropertyDescriptor(currentClass.prototype, type).set;
    return setter;
    /*
    注意先拿到原setter后 再去重写新setter, 否则会进入死循环
    拿到 setter 可以这样用
        if(setter){
            Object.defineProperty(<原setter所在的类型>.prototype, type, {
                set: function (value) {
                    //......    你要在setter里添加的业务逻辑
                    setter.call(this, value);//<-- 注意 set: function(){} 没有return
                },
                enumerable: true,
                configurable: true
            })
        }
    */
    
}

/**动态获得一个类型中定义的getter 方便重新写扩展*/
export function getGetter(currentClass: any, type: string): any {    
    let getter = Object.getOwnPropertyDescriptor(currentClass.prototype, type).get;
    return getter;
    /*
    注意先拿到原getter后 再去重写新getter, 否则会进入死循环
    拿到 getter 可以这样用
        if(getter){
            Object.defineProperty(<原getter所在的类型>.prototype, type, {
                get: function (value) {
                    //......    你要在getter里添加的业务逻辑
                    return getter.call(this, value);//<-- 注意 get: function(){} 有return
                },
                enumerable: true,
                configurable: true
            })
        }
    */
    
}

if (DEBUG) {
    window["superSetter"] = superSetter;
    window["superGetter"] = superGetter;
    window["getSetter"] = getSetter;
    window["getGetter"] = getGetter;
}
