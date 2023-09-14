import { MainEntry } from "./../script/MainEntry";
import { Scene2 } from "./../script/Scene2";
import { alignMgr } from "./develop/ccutils/alignMgr";



export class ClassDictionary {
	public static classDic: { [key: string]: any } = {};
	/**
	 * 获得一个实例或Class的类型名称
	 * 
	 */
	public static getClassNameByTarget(anyObj: any): string {
		if (!anyObj) {
			let proto = Object.prototype.toString.call(anyObj).split()[1].split("]")[0];
			return proto;
		}
		if (anyObj) {
			//anyObj非空时 有 ["__class__"] 的是实例 否则是一个Class
			if (anyObj.prototype && anyObj.prototype["__classname__"]) return anyObj.prototype["__classname__"];//Class
			if (anyObj.prototype && anyObj.prototype["__class__"]) return anyObj.prototype["__class__"];//Class
			if (anyObj.prototype && anyObj.prototype["constructor"]) return anyObj.prototype["constructor"].name;//Class
			if (anyObj["constructor"] && anyObj["constructor"].name) return anyObj["constructor"].name;//实例
			if (anyObj.name) return anyObj.name;//Class
			if (anyObj["__classname__"]) return anyObj["__classname__"];//实例
			if (anyObj["__class__"]) return anyObj["__class__"];//实例
			if (anyObj["__proto__"] && anyObj["__proto__"].name) return anyObj["__proto__"].name;//实例   
		}
		let str = Object.prototype.toLocaleString.call(anyObj);
		let str1: string = str.split()[1];
		return str1.split("]")[0];
	}

	/**
	 * 获得项目里一个实例的原类型引用 可以用来创建实例 或比较类型
	 * @example
	 * 1
	 * var node:Texture2D = new Texture2D();
	 * var cls = ClassDictionary.getClassByTarget(node);//返回 Texture2D
	 * var node2:cls = new cls();
	 * 
	 * 2
	 * var a:Sprite = new Sprite();
	 * var b:Button = new Button();
	 * if(ClassDictionary.getClassByTarget(a) == ClassDictionary.getClassByTarget(b)){
	 * 		......
	 * }
	 * 
	 */
	public static getClassByTarget<T>(anyObj: T): new (...args) => T {
		if (anyObj === null || anyObj === undefined) {//0 或 boolean 都会返回类型
			return null;
		}
		if (typeof anyObj == "function") {
			return <any>anyObj;
		}
		return <any>anyObj["constructor"];
	}
}

ClassDictionary.classDic["MainEntry"] = MainEntry;
ClassDictionary.classDic["Scene2"] = Scene2;
ClassDictionary.classDic["alignMgr"] = alignMgr;
