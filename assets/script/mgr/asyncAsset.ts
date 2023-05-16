import { DEBUG } from "cc/env";
import { AssetManager, assetManager, Asset, SpriteFrame, Texture2D } from "cc";
import { usingAssets, usingBundles } from "../config/usingAssets";

//傻瓜式用法 let res = await asyncAsset.loadOneBundle("bundleName", "资源在bundle文件夹件里的路径", cc类型列如SpriteFrame); 自动先搜索或加载bundle 再搜索或加载资源 然后返回

/*
    此工具类 适用于加载 Bundle包里的资源(因为此类资源能随着发布版本出包到asset文件夹或remote文件夹);
    不在Bundle包中的资源, 不建议通过代码来加载;
    除非你确定它们在发布的时候会被打包进asset或remote文件夹, (最好在开发阶段就经常测试一下发布版的效果)
    否则在debug版能正常加载的资源, 到了release版却不能加载就拉胯了
*/

class AsyncAsset {
    /**
     * 通过异步队列的方式加载一个分包 bundle , 第二个参数的用途是: 询问是否在加载bundle的同时, 顺便把该bundle下的所有子资源都一并加载了
     */
    public static async loadOneBundle(bundleName: string, loadAllSubAssets = false, onProgress?: (finished, total, res?) => void, onComplete?: (resArray?) => void,): Promise<AssetManager.Bundle> {
        return new Promise<AssetManager.Bundle>(resolve => {
            if (DEBUG && bundleName in usingBundles == false) {
                console.log("%cBundle: %c" + bundleName + "\n%c未在usingBundles字典中注册过!  如果你确定在项目里存在Bundle, 请双击根目录下的工具 'usingAssetExport_3x.py' 自动注册", "color:#b36d41", "color:#ff0000", "color:#b36d41")
                resolve(null);
            }
            let _bundle = assetManager.getBundle(bundleName);
            if (_bundle) {
                if (!loadAllSubAssets) {
                    resolve(_bundle);
                }
                else {
                    _bundle.loadDir("./", (finished, total, res) => {
                        if (onProgress) {
                            onProgress(finished, total, res);
                        }
                    },
                        (error, resArray) => {
                            if (onComplete) {
                                onComplete(resArray);
                            }
                            if (!error) {
                                resolve(_bundle);
                            }
                            else {
                                resolve(null);//即使加载失败了也调用resolve() 当做成功来进行异步回调, 不过此时返回的是null, 表示该bundle不存在
                            }
                        })
                }
                return;
            }
            try {
                assetManager.loadBundle(bundleName, (error, bundle) => {
                    if (!error) {
                        if (!loadAllSubAssets) {
                            resolve(bundle);
                        }
                        else {
                            bundle.loadDir("./", (finished, total, res) => {
                                if (onProgress) {
                                    onProgress(finished, total, res);
                                }
                            },
                                (error, resArray) => {
                                    if (onComplete) {
                                        onComplete(resArray);
                                    }
                                    if (!error) {
                                        resolve(bundle);
                                    }
                                    else {
                                        resolve(null);//即使加载失败了也调用resolve() 当做成功来进行异步回调, 不过此时返回的是null, 表示该bundle不存在
                                    }
                                })
                        }
                    }
                    else {
                        console.info("bundle " + bundleName + " 不存在!")
                        resolve(null);//即使加载失败了也调用resolve() 当做成功来进行异步回调, 不过此时返回的是null, 表示该bundle不存在
                    }
                })
            } catch (err) { console.log(err); }
        });
    }


    /**
     *  让一个 AssetManager.bundle 对象加载在其主文件夹下的某个文件下的所有资源 如果资源已被销毁, 将自动移除出缓存字典并重新加载
     *  如果要加载 bundle 本身的文件夹, 第二个参数写 "./" 或使用默认值就好 
     */
    public static async bundleLoadDir(bundle: AssetManager.Bundle | string, dirName: string = "./", onProgress?: (finished, total, res?) => void, onComplete?: (resArray?) => void): Promise<Asset[]> {
        let destroyedList: Asset[] = [];
        let _bundle: any = bundle;
        if (_bundle instanceof AssetManager.Bundle == false) {
            _bundle = await asyncAsset.loadOneBundle(_bundle);
        }
        return new Promise<Asset[]>(resolve => {
            if (!_bundle) {
                resolve(null);
                if (onProgress) {
                    onProgress(0, 0, "");
                }
                if (onComplete) {
                    onComplete(null);
                }
                return;
            }
            _bundle.loadDir(dirName,
                (finished, total, res) => {
                    if (onProgress) {
                        onProgress(finished, total, res.url);//注意:加载总数不一定就是资源文件的总个数  一个图集文件下的子图数量也是会计入总数当中的
                    }
                },
                (error, resArray: any[]) => {
                    console.log(resArray.length, resArray[0]);
                    for (let i = 0; i < resArray.length; i++) {
                        let res = assetManager.assets.get(resArray[i].uuid);
                        if (res && !res.isValid) {
                            destroyedList.push(resArray[i]);
                            resArray.splice(i, 1);
                            i--;
                        }
                    }
                    if (destroyedList.length == 0) {//所有资源均没有被销毁过
                        if (onComplete) {
                            onComplete(resArray);
                        }
                        if (!error) {
                            resolve(resArray);
                        }
                        else {
                            resolve(null);//即使加载失败了也调用resolve() 当做成功来进行异步回调, 不过此时返回的是null, 表示该bundle不存在
                        }
                    }
                    else {//否则启动重新加载队列
                        console.warn("重新加载被销毁的资源!", destroyedList, resArray[0].isValid);
                        let count = destroyedList.length;
                        while (destroyedList[0]) {
                            let item = destroyedList.pop();
                            let res = assetManager.assets.get(item.uuid);
                            assetManager.releaseAsset(res);
                            assetManager.assets.remove(res.uuid);
                            assetManager.loadAny(res.uuid, (err, newRes) => {
                                count--;
                                if (!err) {
                                    resArray.push(newRes);
                                }
                                else {
                                    assetManager.assets.add(res.uuid, res);
                                    resArray.push(res);//重新加载发生错误, 把被销毁的资源塞回去充数
                                }
                                if (count == 0) {
                                    if (onComplete) {
                                        onComplete(resArray);
                                    }
                                    resolve(resArray);
                                }
                            })
                        }

                    }
                })
        });
    }


    /**
     *  让一个 AssetManager.bundle 对象加载在其主文件夹下的某个资源
     *  (注意:第二个参数不要带后缀名 例如 aaa/bbb.json 只要写 "aaa/bbb"就好)
     *  3.x的巨坑: 如果加载的是图片资源 例如 aa/bb/img.jpg   要写成 "aa/bb/img/spriteFrame"(加载出来的是SpriteFrame对象) 或 "aa/bb/img/texture"(加载出来的是Texture2D对象) 直接写 "aa/bb/img" 加载出来的是不伦不类的 ImageAsset 对象
     */
    public static async bundleLoadOneAsset<T extends Asset>(bundle: AssetManager.Bundle | string, urlObj: string, assetType?: new (...args) => T, onComplete?: (currentRes: T) => void): Promise<T>;
    public static async bundleLoadOneAsset<T extends Asset>(bundle: AssetManager.Bundle | string, urlObj: { url: string }, assetType?: new (...args) => T, onComplete?: (currentRes?: T) => void): Promise<T>;
    public static async bundleLoadOneAsset<T extends Asset>(bundle: AssetManager.Bundle | string, urlObj: string | { url: string }, assetType?: new (...args) => T, onComplete?: (currentRes?: T) => void): Promise<T> {
        let _bundle: any = bundle;
        if (typeof bundle == "string") {
            _bundle = assetManager.getBundle(bundle);
        }
        if (!_bundle) {
            if (typeof bundle == "string") {
                _bundle = await asyncAsset.loadOneBundle(bundle);
            }
        }
        let _urlObj: any = urlObj;
        //如果传入的urlObj是usingAsset.ts里的配置 assetType自动等于 urlObj.type
        if (!assetType && _urlObj.type) {
            assetType = _urlObj.type;
        }
        let resUrl = _urlObj["url"] || _urlObj;
        if (resUrl[resUrl.length - 1] == "/") {
            resUrl = resUrl.substring(0, resUrl.length - 1);
        }
        if (assetType && assetType.prototype && assetType.prototype.constructor) {//自动对应类型 补齐图片资源的后缀路径
            let _assetType: any = assetType;
            if (_assetType == SpriteFrame) {
                let arr = resUrl.split("/");
                if (arr[arr.length - 1] !== "spriteFrame") {
                    resUrl += "/spriteFrame";
                }
            }
            else if (_assetType == Texture2D) {
                let arr = resUrl.split("/");
                if (arr[arr.length - 1] !== "texture") {
                    resUrl += "/texture";
                }
            }
        }

        return new Promise<T>(resolve => {
            if (!_bundle) {
                console.warn("bundle不存在, 或未被加载");
                if (onComplete) {
                    onComplete(null);
                }
                resolve(null);
                return;
            }
            let _assetType: any = assetType;
            if (!assetType) {
                _assetType = Asset;
            }
            let _res = _bundle.get(resUrl, _assetType);
            if (_res && !_res.isValid) {//此资源存在于缓存中, 但是已经被销毁不可重用
                assetManager.releaseAsset(_res);//解除依赖关系 并从缓存字典中移除
                assetManager.assets.remove(_res.uuid);
            }
            _bundle.load(resUrl, _assetType, (error, res: T) => {
                if (!error) {
                    if (onComplete) {
                        onComplete(res);
                    }
                    resolve(res);
                }
                else {
                    console.warn("资源不存在, 请检查路径bundle " + _bundle.name + "所在路径" + _bundle.base + "下是否存在文件路径" + resUrl);//如果不存在,那多半是用错bundle或bundle路径了
                    if (onComplete) {
                        onComplete(res);
                    }
                    resolve(null);//即使加载失败了也调用resolve() 当做成功来进行异步回调, 不过此时返回的是null, 表示该bundle不存在
                }
            })

        });
    }

    //加载远程资源
    /*
    //loadRemote 回调中，首先检查该 ImageAsset 是否已有对应的 SpriteFrame，有则直接用，没有则创建一个新的 SpriteFrame 和 Texture2D，然后计数加1；
    assetManager.loadRemote<ImageAsset>(url, (err, imageAsset) => {
        if (!err && imageAsset) {
            let spFrame = this.cache[imageAsset._uuid];
            if (!spFrame) {
                const texture = new Texture2D();
                texture.image = imageAsset;
                spFrame = new SpriteFrame();
                spFrame.texture = texture;
                imageAsset.addRef();
                this.cache[imageAsset._uuid] = spFrame; // 添加映射表记录
            }
            spFrame.addRef(); // 计数加1
        }
    }); 
    */

    //从远程加载资源  不要指定类型 会容易报错的  例如 加载远程图片默认是 ImageAsset类型, 强制指定 SpriteFrame 就会报错了
    public static async loadOneRemote(url: string, onComplete?: (currentRes?: Asset) => void): Promise<Asset> {
        return new Promise<Asset>(resolve => {
            let _res = assetManager.assets.get(url);
            if (_res && !_res.isValid) {//此资源存在于缓存中, 但是已经被销毁不可重用
                assetManager.releaseAsset(_res);//解除依赖关系 并从缓存字典中移除
                assetManager.assets.remove(url);;
            }
            assetManager.loadRemote(url, { cacheAsset: false }, (err, asset) => {
                if (err) {
                    console.info("加载远程资源 " + url + " 失败!");
                }
                else {
                    assetManager.assets.add(url, asset);
                    asset["$_$__remoteURL__"] = url;
                    if (onComplete) {
                        onComplete(asset);//获取最后一个资源 
                    }
                }
                resolve(asset);
            })
        });
    }

    public static async loadRemotes(urlObject: string | string[], onProgress?: (finished?: number, total?: number, currentRes?: Asset) => void, onComplete?: (currentRes?: Asset[]) => void): Promise<Asset[]> {
        return new Promise<Asset[]>(resolve => {
            let urlArr: string[] = [];
            urlArr = urlArr.concat(urlObject);
            let total = urlArr.length;
            let count = 0;
            let assets: Asset[] = [];
            for (let url of urlArr) {
                let _res = assetManager.assets.get(url);
                if (_res && !_res.isValid) {//此资源存在于缓存中, 但是已经被销毁不可重用
                    assetManager.releaseAsset(_res);//解除依赖关系 并从缓存字典中移除
                    assetManager.assets.remove(url);;
                }
                assetManager.loadRemote(url, { cacheAsset: false }, (err, asset: Asset) => {
                    if (err != undefined) {
                        console.info("加载资源 " + url + " 失败!");
                    }
                    else {
                        asset["$_$__remoteURL__"] = url;
                    }
                    assets[assets.length] = asset;
                    count++;
                    if (onProgress) {
                        onProgress(count, total, asset);
                    }
                    if (count == urlArr.length) {
                        if (onComplete) {
                            onComplete(assets);//获取资源集
                        }
                        resolve(assets);
                    }
                })
            }
        });
    }


    /**
     *  直接通过usingAssets里的配置获取其中一个资源
     */
    public static async loadOneUsingAsset<T>(usingAsset: { bundle: string, url: string, type: new (...args) => T }, onComplete?: (res: T) => void): Promise<T> {
        let res = await asyncAsset.bundleLoadOneAsset(usingAsset.bundle, usingAsset);
        return new Promise<any>(resolve => {
            if (onComplete) {
                onComplete(<any>res);
            }
            resolve(res);
        })
    }


    /**
     *  让一个 AssetManager.bundle 对象加载在其主文件夹下、并且在usingAssets.ts文件中配置过的所有资源 
     */
    public static async bundleLoadAllUsingAssets(bundle: AssetManager.Bundle | string, onProgress?: (finished: number, total: number, finishPath?: string) => void, onComplete?: (resArr?: Asset[]) => void): Promise<Asset[]> {
        let _bundle: any = bundle;
        if (typeof bundle == "string") {
            _bundle = assetManager.getBundle(bundle);
            if (!_bundle) {
                _bundle = await asyncAsset.loadOneBundle(bundle);
            }
        }

        return new Promise<Asset[]>(resolve => {
            if (!_bundle) {
                console.warn("bundle不存在, 或未被加载");
                resolve(null);
                if (onProgress) {
                    onProgress(0, 0, "");
                }
                if (onComplete) {
                    onComplete(null);
                }
                return;
            }

            const name = _bundle.name;
            const keys = [];

            for (let key in usingAssets[name]) {
                keys.push(key);
            }

            let fin = 0;
            let total = keys.length;
            for (let i = 0; i < keys.length; i++) {
                let object: any = usingAssets[name][keys[i]];
                if (object.urlPrefix) {
                    total += object.end - object.start;
                }
            }

            for (let i = 0; i < keys.length; i++) {
                let object: any = usingAssets[name][keys[i]];
                if (object.url) {
                    if (object.url[object.url.length - 1] == "/") {
                        object.url = object.url.substring(0, object.url.length - 1);
                    }
                    if (object.type && object.type.prototype && object.type.prototype.constructor) {//自动对应类型 补齐图片资源的后缀路径

                        if (object.type == SpriteFrame) {
                            let arr = object.url.split("/");
                            if (arr[arr.length - 1] !== "spriteFrame") {
                                object.url += "/spriteFrame";
                            }
                        }
                        else if (object.type == Texture2D) {
                            let arr = object.url.split("/");
                            if (arr[arr.length - 1] !== "texture") {
                                object.url += "/texture";
                            }
                        }
                    }

                    let _res = _bundle.get(object.url, object.type);
                    if (_res && !_res.isValid) {//此资源存在于缓存中, 但是已经被销毁不可重用
                        assetManager.releaseAsset(_res);//解除依赖关系 并从缓存字典中移除
                        assetManager.assets.remove(_res.uuid);
                    }

                    let resArr: Asset[] = [];
                    _bundle.load(object.url, object.type, (err, res) => {
                        fin++;
                        if (err != undefined) {
                            console.info("资源包<" + name + "> 加载 {url:\"" + object.url + "\"" + ", type:\"" + object.type.prototype["__classname__"] + "\"} 失败!");//检查路径和类型
                        }
                        if (onProgress) {
                            onProgress(fin, total, object.url);
                        }
                        resArr.push(res);
                        if (fin == total) {
                            if (onComplete) {
                                onComplete(resArr);
                            }
                            resolve(resArr);
                        }
                    });
                }
            }
        })
    }


    /**
     *  把assetManager.loadAny转为异步队列 函数 可以通过 await实现
     */
    public static async loadAny<T extends Asset>(requests: string, typeOrOnComplete?: (res) => void): Promise<T>;
    public static async loadAny<T extends Asset>(requests: string, typeOrOnComplete?: (new (...args) => T), onComplete?: (res) => void): Promise<T>;
    public static async loadAny<T extends Asset>(requests: string, typeOrOnComplete?: (new (...args) => T) | ((res) => void), onComplete?: (res) => void): Promise<T> {
        /* let type: new (...args) => T;
        let onComplete: (res) => void; */
        if (typeOrOnComplete) {
            if (Object.getPrototypeOf(typeOrOnComplete) == Asset) {//typeOrOnComplete是类型参数
                return new Promise<T>(resolve => {
                    assetManager.loadAny(requests, typeOrOnComplete, (err, res: T) => {
                        if (!err) {
                            if (res && !res.isValid) {
                                assetManager.releaseAsset(res);//解除依赖关系 并从缓存字典中移除
                                assetManager.assets.remove(res.uuid);
                                assetManager.loadAny(requests, (err, res: T) => {
                                    if (onComplete) {
                                        onComplete(res);
                                    }
                                    resolve(res);
                                })
                            }
                            else {
                                if (onComplete) {
                                    onComplete(res);
                                }
                                resolve(res);
                            }
                        }
                        else {
                            if (onComplete) {
                                onComplete(res);
                            }
                            resolve(null);
                        }
                    })
                })
            }
            else {
                let _typeOrOnComplete: any = typeOrOnComplete;//typeOrOnComplete是成功回调
                return new Promise<T>(resolve => {
                    assetManager.loadAny(requests, (err, res: T) => {
                        if (!err) {
                            if (res && !res.isValid) {
                                assetManager.releaseAsset(res);//解除依赖关系 并从缓存字典中移除
                                assetManager.assets.remove(res.uuid);
                                assetManager.loadAny(requests, (err, res: T) => {
                                    _typeOrOnComplete(res);
                                    resolve(res);
                                })
                            }
                            else {
                                _typeOrOnComplete(res);
                                resolve(res);
                            }
                        }
                        else {
                            _typeOrOnComplete(res);
                            resolve(res);
                        }
                    })
                })

            }
        }
        else {
            return new Promise<T>(resolve => {
                assetManager.loadAny(requests, (err, res: T) => {
                    if (!err) {
                        if (res && !res.isValid) {
                            assetManager.releaseAsset(res);//解除依赖关系 并从缓存字典中移除
                            assetManager.assets.remove(res.uuid);
                            assetManager.loadAny(requests, (err, res: T) => {
                                if (onComplete) {
                                    onComplete(res);
                                }
                                resolve(res);
                            })
                        }
                        else {
                            if (onComplete) {
                                onComplete(res);
                            }
                            resolve(res);
                        }
                    }
                    else {
                        if (onComplete) {
                            onComplete(res);
                        }
                        resolve(res);
                    }
                })
            })
        }
    }
}
export const asyncAsset = AsyncAsset;
globalThis["asyncAsset"] = asyncAsset;

AssetManager.Bundle.prototype["getUsingAsset"] = function <T extends Asset>(usingAsset: { url: string, type: new (...parmas) => T }): T {
    return this.get(usingAsset.url, usingAsset.type);
}