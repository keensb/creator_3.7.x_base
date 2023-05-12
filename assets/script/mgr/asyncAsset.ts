import { AssetManager, assetManager, Asset, SpriteFrame } from "cc";
import { usingAssets } from "../config/usingAssets";

//傻瓜式用法 let res = await asyncAsset.loadOneBundle("bundleName", "资源在bundle文件夹件里的路径", cc类型列如SpriteFrame); 自动先搜索或加载bundle 再搜索或加载资源 然后返回

/*
//关于官方文档 的 "可传入进度回调以及完成回调，通过组合 `request` 和 `options` 参数，几乎可以实现和扩展所有想要的加载效果。非常建议"  --- request 和 options 是个什么鬼??
1 首先在控制台输入 
    cc.assetManager.loadAny 
  会返回代码块 点击代码块可以定位到实现assetManager.loadAny的位置

2 在 public loadAny() 函数定义的末行  "pipeline.async(task);" 打个断点

3 在控制台输入 
    cc.assetManager.loadAny({'path': 'images/background'}, {'myParam': 'important'}, ()=>{console.log("这是进度回调 progress callback")}, ()=>{console.log("这是完成回调 complete callback")});

4 断点被命中时 在控制台依次输入 request、 options、 onProgress、 onComplete  看看这些都是啥

5 省流: request={'path': 'images/background'}  options={'myParam': 'important'}  
*/

class AsyncAsset {
    /**
     * 通过异步队列的方式加载一个分包 bundle , 第二个参数的用途是: 询问是否在加载bundle的同时, 顺便把该bundle下的所有子资源都一并加载了
     */
    public static async loadOneBundle(bundleName: string, loadAllSubAssets = false, onProgress?: (finished, total, res?) => void, onComplete?: (error?, resArray?) => void,): Promise<AssetManager.Bundle> {
        return new Promise<AssetManager.Bundle>(resolve => {
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
                                onComplete(error, resArray);
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
                                    onComplete(error, resArray);
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
        });
    }


    /**
     *  让一个 AssetManager.bundle 对象加载在其主文件夹下的某个文件下的所有资源 如果资源已被销毁, 将自动移除出缓存字典并重新加载
     *  如果要加载 bundle 本身的文件夹, 第二个参数写 "./" 或使用默认值就好 
     */
    public static async bundleLoadDir(bundle: AssetManager.Bundle | string, dirName: string = "./", onProgress?: (finished, total, res?) => void, onComplete?: (error?, resArray?) => void): Promise<Asset[]> {
        let destroyedCount = 0;
        let destroyedList: Asset[] = [];
        let _bundle: any = bundle;
        if (_bundle instanceof AssetManager.Bundle == false) {
            _bundle = await asyncAsset.loadOneBundle(_bundle);
        }
        return new Promise<Asset[]>(resolve => {
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
                            onComplete(error, resArray);
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
                                        onComplete(error, resArray);
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
    public static async bundleLoadOneAsset<T>(bundle: AssetManager.Bundle | string, urlObj: string, assetType?: new (...args) => T, onComplete?: (currentRes?: new (...args) => T) => void): Promise<T>;
    public static async bundleLoadOneAsset<T>(bundle: AssetManager.Bundle | string, urlObj: { url: string }, assetType?: new (...args) => T, onComplete?: (currentRes?: new (...args) => T) => void): Promise<T>;
    public static async bundleLoadOneAsset<T>(bundle: AssetManager.Bundle | string, urlObj: string | { url: string }, assetType?: new (...args) => T, onComplete?: (currentRes?: any) => void): Promise<T> {
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
            if (assetType.prototype.constructor.name == "SpriteFrame") {
                let arr = resUrl.split("/");
                if (arr[arr.length - 1] !== "spriteFrame") {
                    resUrl += "/spriteFrame";
                }
            }
            else if (assetType.prototype.constructor.name == "Texture2D") {
                let arr = resUrl.split("/");
                if (arr[arr.length - 1] !== "texture") {
                    resUrl += "/texture";
                }
            }
        }

        return new Promise<T>(resolve => {
            if (!_bundle) {
                console.warn("bundle不存在, 或未被加载");
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
            _bundle.load(resUrl, _assetType, (error, res: any) => {
                if (!error) {
                    resolve(res);
                }
                else {
                    console.warn("资源不存在, 请检查路径bundle " + _bundle.name + "所在路径" + _bundle.base + "下是否存在文件路径" + resUrl);//如果不存在,那多半是用错bundle或bundle路径了
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
    public static async loadOneUsingAsset<T>(usingAsset: { bundle: string, url: string, type: new (...args) => T }, onComplete?: (currentRes?: new (...args) => T) => void): Promise<T> {
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
    public static async bundleLoadAllUsingAssets(bundle: AssetManager.Bundle | string, onProgress?: (finished: number, total: number, finishPath?: string) => void, onComplete?: () => void): Promise<void> {
        let _bundle: any = bundle;
        if (typeof bundle == "string") {
            _bundle = assetManager.getBundle(bundle);
            if (!_bundle) {
                _bundle = await asyncAsset.loadOneBundle(bundle);
            }
        }

        return new Promise(resolve => {
            if (!_bundle) {
                console.warn("bundle不存在, 或未被加载");
                resolve(null);
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

                        if (object.type.prototype.constructor.name == "SpriteFrame") {
                            let arr = object.url.split("/");
                            if (arr[arr.length - 1] !== "spriteFrame") {
                                object.url += "/spriteFrame";
                            }
                        }
                        else if (object.type.prototype.constructor.name == "Texture2D") {
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

                    _bundle.load(object.url, object.type, (err, res) => {
                        fin++;
                        if (err != undefined) {
                            console.info("资源包<" + name + "> 加载 {url:\"" + object.url + "\"" + ", type:\"" + object.type.prototype["__classname__"] + "\"} 失败!");//检查路径和类型
                        }
                        if (onProgress) {
                            onProgress(fin, total, object.url);
                        }
                        if (fin == total) {
                            if (onComplete) {
                                onComplete();
                            }
                            resolve();
                        }
                    });
                }
                else {//以下是早前用于批量加载序列帧动画纹理的业务逻辑, 由于需求的数据格式无法通过工具asserExport.py实现(需要手动添加编辑, 但是每次运行asserExport.py就会被覆盖)  现已废弃 也可以保留
                    if (object.urlPrefix) {
                        //例如 testList: { urlPrefix: "aa/bb/cc", variableLength: 3, start:1, end:215, suffix:"_game_png", type: SpriteFrame }, 将加载 "aa/bb/cc001_game_png" 到 "aa/bb/cc215_game_png" 的资源
                        if (object.start > object.end) {
                            console.info("资源包<" + name + "> " + object.urlPrefix + " 出现序列资源问题, start数值" + object.start + " 大于end数值" + object.end);
                            return;
                        }
                        for (let j: number = object.start; j <= object.end; j++) {

                            let str = j.toString();
                            while (str.length < object.variableLength) {//仅在当前序列数值长度小于指定变量长度时, 才在序列数值前面补0;  如果指定长度是0 或 1, 而当前序列数值是 10(长度为2), 则不做处理(自适像 xxx_1.png<注意不是xxx_001.png> 到 xxx_9999.png 这类不固定后缀变量长度的序列)
                                str = 0 + str;
                            }
                            if (!object.type) {
                                object.type = SpriteFrame;
                            }
                            if (!object.suffix) {
                                object.suffix = "";
                            }
                            //if (!object.suffix)
                            let url = object.urlPrefix + str + object.suffix;
                            if (url[url.length - 1] == "/") {
                                url = url.substring(0, url.length - 1);
                            }

                            if (object.type && object.type.prototype && object.type.prototype.constructor) {//自动对应类型 补齐图片资源的后缀路径
                                if (object.type.prototype.constructor.name == "SpriteFrame") {
                                    let arr = url.split("/");
                                    if (arr[arr.length - 1] !== "spriteFrame") {
                                        url += "/spriteFrame";
                                    }
                                }
                                else if (object.type.prototype.constructor.name == "Texture2D") {
                                    let arr = url.split("/");
                                    if (arr[arr.length - 1] !== "texture") {
                                        url += "/texture";
                                    }
                                }
                            }

                            let _res = _bundle.get(url, object.type);
                            if (_res && !_res.isValid) {//此资源存在于缓存中, 但是已经被销毁不可重用
                                assetManager.releaseAsset(_res);//解除依赖关系 并从缓存字典中移除
                                assetManager.assets.remove(_res.uuid);
                            }
                            _bundle.load(url, object.type, (err, res) => {
                                if (err != undefined) {
                                    console.info("资源包<" + name + "> 加载 {url:\"" + url + "\"" + ", type:\"" + object.type.prototype["__classname__"] + "\"} 失败!");//检查路径和类型
                                }
                                fin++;
                                if (onProgress) {
                                    onProgress(fin, total, url);
                                }
                                if (fin == total) {
                                    if (onComplete) {
                                        onComplete();
                                    }
                                    resolve();
                                }

                            });
                        }
                    }
                }
            }
        })
    }


    /**
     *  把assetManager.loadAny转为异步队列 函数 可以通过 await实现
     */
    public static async loadAny<T extends Asset>(requests: string, type?: new (...agrs) => T): Promise<T>;
    public static async loadAny<T extends Asset>(requests: string, onComplete?: (res: T) => void): Promise<T>;
    public static async loadAny<T extends Asset>(requests: string[], type?: new (...agrs) => T): Promise<T>;
    public static async loadAny<T extends Asset>(requests: string[], onComplete?: (res: T) => void): Promise<T>;
    public static async loadAny<T extends Asset>(requests: string | string[], arg1?: (new (...agrs) => T) | ((res: T) => void), arg2?: (res: T) => void): Promise<T> {
        let onComplete: any = arg1;
        if (arg1 && arg1["__proto__"] && arg1["__proto__"].name == "Asset") {//如果这是一个类型
            onComplete = arg2;
        }

        return new Promise<T>(resolve => {
            assetManager.loadAny(requests, (err, res: T) => {
                if (!err) {
                    if (res && !res.isValid) {
                        assetManager.releaseAsset(res);//解除依赖关系 并从缓存字典中移除
                        assetManager.assets.remove(res.uuid);
                        assetManager.loadAny(requests, (err, res: T) => {
                            if (!err) {
                                if (onComplete) {
                                    onComplete(res);
                                }
                                resolve(res);
                            }
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
                        onComplete(null);
                    }
                    resolve(null);
                }
            })
        })
    }
}
export const asyncAsset = AsyncAsset;
window["asyncAsset"] = asyncAsset;

AssetManager.Bundle.prototype["getUsingAsset"] = function <T extends Asset>(usingAsset: { url: string, type: new (...parmas) => T }): T {
    return this.get(usingAsset.url, usingAsset.type);
}