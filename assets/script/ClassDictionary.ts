import { MainEntry } from "./../script/MainEntry";
import { alignMgr } from "./../script/ccutils/alignMgr";


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
			if (anyObj.prototype && anyObj.prototype["__class__"]) return anyObj.prototype["__class__"];//Class
			if (anyObj.prototype && anyObj.prototype["constructor"]) return anyObj.prototype["constructor"].name;//Class
			if (anyObj["constructor"] && anyObj["constructor"].name) return anyObj["constructor"].name;//实例
			if (anyObj.name) return anyObj.name;//Class
			if (anyObj["__class__"]) return anyObj["__class__"];//实例
			if (anyObj["__proto__"] && anyObj["__proto__"].name) return anyObj["__proto__"].name;//实例   
		}

		let str = Object.prototype.toLocaleString.call(anyObj);
		let str1: string = str.split()[1];
		return str1.split("]")[0];
	}
}

ClassDictionary.classDic["MainEntry"] = MainEntry;
ClassDictionary.classDic["alignMgr"] = alignMgr;
