import { DEBUG } from "cc/env";

var __extends = globalThis && globalThis.__extends || function __extends(t, e) {
    function r() {
        this.constructor = t;
    }
    for (var i in e) e.hasOwnProperty(i) && (t[i] = e[i]);
    r.prototype = e.prototype, t.prototype = new r();
};

export const createSonClass = function (cls: any): any {
    //创建有继承关系的 Class
    let newCls = (function (_super_) {//要点2 声明  class TempSonClass 是一个继承了_super_1 的class 至于_super_1具体是什么类 要写在本class TempSonClass的最末端并传进去
        __extends(TempSonClass, _super_);
        function TempSonClass(...agrs) {//要点3 相当于 构造器constructor(){}
            let thisObj = _super_.call(this, ...arguments) || this;//要点4 相当于 super()
            //这里可以初始化一些变量和对象 例如声明和定义一个 this._content
            //this._content = { "_color": 255 };
            return thisObj;
        }
        return TempSonClass;
    }(cls));//要点6 这里传进了 modules.GSprite 作为Super的参数, 对应了 要点2 声明  class TempSonClass 继承自 modules.GSprite
    return newCls;
}



if (DEBUG) {
    function parentClass(a: number, b: number) {//可以继承 function
        console.log("a =", a, "   b =", b);
    }
    class GGG {//不能继承 class  否则初始化会报错   Class constructors cannot be invoked without 'new'

    }
    window["GGG"] = GGG;
    window["parentClass"] = parentClass;
    window["createSonClass"] = createSonClass;
}