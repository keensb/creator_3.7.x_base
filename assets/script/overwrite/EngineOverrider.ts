//建议通过在主入口类节点 的onLoad执行 EngineOverride.startWrite
//在控制台输入 cc.Sprite 按回车, 出现代码块; 点击代码块可以找到定义的位置在 index.js
//cocos creator 3.0+ 引擎代码位置  可以尝试覆盖这几个位置
//CocosDashboard安装目录\resources\.editors\Creator\3.6.0\resources\resources\3d\engine\bin\.cache\dev\preview\bundled\index.js  主要
//CocosDashboard安装目录\resources\.editors\Creator\3.6.0\resources\resources\3d\engine\cocos\core\scene-graph\node.ts  次要
import { Asset, assetManager, AssetManager, CCObject, Component, debug, director, errorID, ImageAsset, Material, misc, Node, NodeActivator, NodeEventType, path, Prefab, RenderTexture, Scene, Sprite, SpriteAtlas, SpriteFrame, Texture2D, UIOpacity, UIRenderer, UITransform, warn, __private } from 'cc';
import { DEBUG } from 'cc/env';
import { decodeUuid } from '../ccutils/compressedUuid';
import { getSetter } from '../ccutils/Super_Getter_Setter';
import { asyncAsset } from '../mgr/asyncAsset';


class EngineOverrider {
    private static remoteSpriteFrameCache: { [key: string]: SpriteFrame } = {};//远程ImageAsset转换成SpriteFrame资源缓存字典
    public static startWrite() {
        //新增API, 建议把API写进 or.d.ts 下的 interface Node 中,便于在使用时带自动提示功能

        if (DEBUG) {

            Object.defineProperty(Node.prototype, "sprite", {
                get: function () {
                    return this.getComponent(Sprite);
                },
                enumerable: true,
                configurable: true
            })

            Object.defineProperty(Node.prototype, "spriteFrame", {
                get: function () {
                    if (!this.getComponent(Sprite)) {
                        console.warn("本节点原本不存在Sprite组件")
                        this.addComponent(Sprite);
                    }
                    return this.getComponent(Sprite).spriteFrame;
                },
                set: function (value) {
                    if (!this.getComponent(Sprite)) {
                        console.warn("本节点原本不存在Sprite组件")
                        this.addComponent(Sprite)
                    }
                    this.getComponent(Sprite).spriteFrame = value;
                },
                enumerable: true,
                configurable: true
            })

            Object.defineProperty(Node.prototype, "texture", {
                get: function () {
                    if (!this.getComponent(Sprite)) return null;
                    if (!this.getComponent(Sprite).spriteFrame) return null;
                    return this.getComponent(Sprite).spriteFrame.texture;
                },
                enumerable: true,
                configurable: true
            })

            globalThis["$cr"] = function (sf?: SpriteFrame): Node {
                let newNode = new Node();
                newNode.addComponent(Sprite).spriteFrame = sf;
                return newNode;
            }
        }

        Object.defineProperty(Node.prototype, "stage", {
            get: function () {
                let parent = this.parent;
                while (parent && parent.parent) {
                    parent = parent.parent;
                }
                return parent == director.getScene() ? parent : null;
            },
            enumerable: true,
            configurable: true
        })




        Object.defineProperty(Sprite.prototype, "asyncSpriteFrame", {
            //这是一个异步的 settter
            set: async function (sfObject: SpriteFrame | { bundle: string, url: string } | [{ bundle: string, type: new (...args) => SpriteAtlas, url: string }, string] | string) {
                let _this = this;
                _this._tempSpriteFrame = sfObject;
                if (!_this.isValid) return;
                let spriteFrame: SpriteFrame;

                if (sfObject == null) {
                    this.spriteFrame = null;
                    delete _this._tempSpriteFrame;
                    return;
                }

                if (typeof sfObject == "object") {// SpriteFrame实例       如果 sprite.spriteFrame != null 可以通过 sprite.asyncSpriteFrame = sprite.spriteFrame 的方式, 再次加载回被destroy的SpriteFrame
                    if (sfObject instanceof SpriteFrame) {
                        spriteFrame = sfObject as SpriteFrame;
                        let _sfObject: any = sfObject;
                        //确定是SpriteFrame实例
                        if (spriteFrame && !spriteFrame.isValid) {//如果已destroy 通过url或uuid再次加载回来
                            if ("$_$__remoteURL__" in _sfObject) {
                                _sfObject["$_$__remoteURL__"] = _sfObject._uuid;

                                let imageAsset = await asyncAsset.loadOneRemote(sfObject["$_$__remoteURL__"]) as ImageAsset;//从远程加载来的都是 ImageAsset
                                let spriteFrame;
                                if (imageAsset) {
                                    spriteFrame = new SpriteFrame();
                                    let texture = new Texture2D();
                                    texture.image = imageAsset;
                                    spriteFrame.texture = texture;
                                    spriteFrame["$_$__remoteURL__"] = sfObject["$_$__remoteURL__"];
                                    spriteFrame._uuid = spriteFrame["$_$__remoteURL__"];
                                    EngineOverrider.remoteSpriteFrameCache[sfObject["$_$__remoteURL__"]] = spriteFrame;
                                }
                                if (_this.isValid) _this.spriteFrame = spriteFrame;
                                delete _this._tempSpriteFrame;
                            }
                            else {
                                spriteFrame = await asyncAsset.loadAny(sfObject["uuid"], SpriteFrame);
                                if (_this.isValid) _this.spriteFrame = spriteFrame;
                                delete _this._tempSpriteFrame;
                            }
                        }
                        else {
                            if (_this.isValid) _this.spriteFrame = spriteFrame;
                            delete _this._tempSpriteFrame;
                        }
                    }
                    else if (sfObject["bundle"] && sfObject["url"]) {// usingAssets配置资源      建议参数使用 usingAsset的配置
                        spriteFrame = await asyncAsset.bundleLoadOneAsset(sfObject["bundle"], sfObject["url"], SpriteFrame);
                        if (_this.isValid) _this.spriteFrame = spriteFrame;
                        delete _this._tempSpriteFrame;
                    }
                    else if (sfObject["length"] > 1 && sfObject[0]["bundle"] && sfObject[0]["type"] == SpriteAtlas) {//某图集下的子图 建议参数使用 usingAsset的配置
                        let spriteAtlas = await asyncAsset.bundleLoadOneAsset(sfObject[0]["bundle"], sfObject[0]["url"], SpriteAtlas);
                        spriteFrame = spriteAtlas.getSpriteFrame(sfObject[1]);
                        if (spriteFrame && !spriteFrame.isValid) {
                            //asyncAsset.loadAny 会自动识别和处理 被销毁的spriteFrame 
                            spriteFrame = await asyncAsset.loadAny(spriteFrame.uuid, SpriteFrame);
                            if (_this.isValid) _this.spriteFrame = spriteFrame;
                            delete _this._tempSpriteFrame;
                        }
                        else {
                            if (_this.isValid) _this.spriteFrame = spriteFrame;
                            delete _this._tempSpriteFrame;
                        }
                    }
                }
                else if (typeof sfObject == "string") {//uuid 或 url地址
                    if (sfObject.indexOf("://") == -1) {//这不是 url地址 那就当做uuid处理 压缩或未压缩的 uuid, asyncAsset.loadAny都会自动识和处理
                        spriteFrame = await asyncAsset.loadAny(sfObject, SpriteFrame);
                        if (_this.isValid) _this.spriteFrame = spriteFrame;
                        delete _this._tempSpriteFrame;
                    }
                    else {
                        if (EngineOverrider.remoteSpriteFrameCache[sfObject] && EngineOverrider.remoteSpriteFrameCache[sfObject].isValid) {
                            spriteFrame = EngineOverrider.remoteSpriteFrameCache[sfObject];
                            if (_this.isValid) _this.spriteFrame = spriteFrame;
                            delete _this._tempSpriteFrame;
                        }
                        else {
                            let spriteFrame;
                            let imageAsset = await asyncAsset.loadOneRemote(sfObject) as ImageAsset;//从远程加载来的都是 ImageAsset
                            if (imageAsset) {
                                spriteFrame = new SpriteFrame();
                                let texture = new Texture2D();
                                texture.image = imageAsset;
                                spriteFrame.texture = texture;
                                spriteFrame["$_$__remoteURL__"] = sfObject;
                                EngineOverrider.remoteSpriteFrameCache[sfObject] = spriteFrame;
                            }
                            if (_this.isValid) _this.spriteFrame = spriteFrame;
                            delete _this._tempSpriteFrame;
                        }
                    }
                }

            },
            get: function () {
                let _this = this;
                if ("_tempSpriteFrame" in _this) return _this._tempSpriteFrame;//如果在异步setter进行中 读取 asyncSpriteFrame   返回的是传入 setter的原始数值
                return _this.spriteFrame;
            },
            enumerable: true,
            configurable: true
        })

        let activateNode = NodeActivator.prototype.activateNode;
        //在节点被激活或取消激活时 统计节点上SpriteFrame的激活引用计数
        NodeActivator.prototype.activateNode = function (node, active) {
            activateNode.call(this, node, active);
            if (node.getComponent(Sprite) && node.getComponent(Sprite).spriteFrame) {
                let sp = node.getComponent(Sprite);
                let sf = node.getComponent(Sprite).spriteFrame;
                if (!sf["$_$__activeRef__"]) sf["$_$__activeRef__"] = 0;
                if (!sf["$_$__activeDic__"]) sf["$_$__activeDic__"] = {};
                if (active && !sf["$_$__activeDic__"][sp.uuid]) {
                    sf["$_$__activeRef__"]++;
                    sf["$_$__activeDic__"][sp.uuid] = 1;
                }
                else if (!active && sf["$_$__activeDic__"][sp.uuid]) {
                    sf["$_$__activeRef__"]--;
                    delete sf["$_$__activeDic__"][sp.uuid];
                }
            }
        }

        let prefab_onLoaded = Prefab.prototype.onLoaded;
        Prefab.prototype.onLoaded = function () {//预制体初始化的时候 把预制体上依赖的SpriteFrame也统计进去
            prefab_onLoaded.call(this);
            //如果预制体的节点上有个Sprite组件, 并且挂载了SpriteFrame
            if (this.data && this.data.getComponent(Sprite) && this.data.getComponent(Sprite).spriteFrame) {
                let sp = this.data.getComponent(Sprite);
                sp["$_$__prefabSprite__"] = this.uuid;
                let sf = sp.spriteFrame;
                if (sf) {
                    if (DEBUG) {
                        sf["$_$__debugDes__"] = {
                            描述: {
                                1: '关于SpriteFrame自定义自动引用计数 $_$__xxxxRef 字段的解释(该说明仅在DEBUG版本可见):',
                                2: '为了避免SpriteFrame繁琐的自增自减操作(addRef和decRef), 采用自动统计策略 为此, 重写了一些底层方法, 但并不与 addRef和decRef 冲突',
                                3: '$_$__spriteRef__ 表示该SpriteFrame当前总共被几个Sprite组件(包括预制体上的Sprite)所引用 并使用 字典对象$_$__spriteDic__ 保存Sprite组件引用 (当销毁该SpriteFrame时, 所有Sprite组件的引用都会自动清空)',
                                4: '$_$__activeRef__ 表示引用该SpriteFrame的Sprite组件所在节点 目前总共有几个正处于激活状态 并使用 字典对象$_$__activeDic__ 保存Sprite组件的uuid',
                                5: '$_$__onStageRef__ 表示引用该SpriteFrame的Sprite组件所在节点 目前总共有几个出现在场景里 并使用 字典对象$_$__onStageDic__ 保存Sprite组件的uuid',
                                6: '如果该SpriteFrame被预制体的Sprite组件所引用、并且该预制体已被加载进assetManager.assets字典(发生依赖), 会添加一个 $_$__prefabRef__ 字段表示当前总共被几个预制体依赖 并使用 字典对象$_$__prefabDic__ 保存预制体的uuid',
                                7: '如果该SpriteFrame的纹理来自远程库的图片,会添加一个 $_$__remoteURL__ 字段记录远程图片资源的位置',
                                8: '※理论上$_$__onStageRef__ 或 $_$__activeRef__ 的值任何时候都不应该大于 $_$__spriteRef__',
                                9: '※根据creator的循环渲染机制 当引用了该SpriteFrame的所有Sprite组件的节点 当前都没有出现在场景上或都没有被激活时(也就是同时存在于$_$__onStageDic__ 和 $_$__activeDic__字典的uuid总和为0时) 才可以通过destroy()安全销毁该SpriteFrame',
                                10: '另外为SpriteFrame类提供了一个destorySafe字段 用于判断该SpriteFrame当前是否可以被销毁和释放(要保证引用该SpriteFrame的Sprite组件所在的节点 不会再次被加载进场景或再次被激活,否则仍然会报错 最好是让 Sprite组件.spriteFrame = 其他值 或销毁Sprite组件)',
                                11: '※建议: 当$_$__spriteRef__的值为0时 才是最安全的销毁时机, 或者使用SpriteFrame类的forceDestroy()方法 强制解除所有引用和依赖关系,并自我销毁'
                            }
                        }
                    }
                    if (!sf["$_$__spriteRef__"]) sf["$_$__spriteRef__"] = 0;
                    if (!sf["$_$__spriteDic__"]) sf["$_$__spriteDic__"] = {};
                    if (!sf["$_$__spriteDic__"][sp.uuid]) {
                        sf["$_$__spriteRef__"]++;
                        sf["$_$__spriteDic__"][sp.uuid] = sp;
                    }

                    if (!sf["$_$__prefabRef__"]) sf["$_$__prefabRef__"] = 0;
                    if (!sf["$_$__prefabDic__"]) sf["$_$__prefabDic__"] = {};
                    if (!sf["$_$__prefabDic__"][this.uuid]) {
                        sf["$_$__prefabRef__"]++;
                        sf["$_$__prefabDic__"][this.uuid] = 1;
                    }
                }
            }
        }


        //检测Node之下有没有这个Component, 有的话直接返回Component的引用; 没有的话自动新增Component实例再返回其引用
        Node.prototype.getOrAddComponent = function <T extends Component>(componentType: new (...parmas) => T, ...args): T {
            return this.getComponent.call(this, componentType) || this.addComponent.call(this, componentType, ...args);
        }

        let spriteFrame_setFunc = getSetter(Sprite, "spriteFrame");//获取 Sprite 定义的 set spriteFrame()
        Object.defineProperty(Sprite.prototype, "spriteFrame", {
            set: function (value) {
                if (value && !value.isValid) {
                    let _url = value["$_$__remoteURL__"] || value.uuid;
                    console.warn(`目标SpriteFrame已被销毁(destroy) 不能继续使用, 请通过 sprite.asyncSpriteFrame = 目标SpriteFrame的uuid 来重新加载  例如 sprite.asyncSpriteFrame = "${_url}"`);
                    spriteFrame_setFunc.call(this, null);
                    return;
                }
                spriteFrame_setFunc.call(this, value);
            },
            enumerable: true,
            configurable: true
        })

        //远程地址从 ImageAsset 传给 Texture2D
        let texture2d_image = getSetter(Texture2D, "image");
        Object.defineProperty(Texture2D.prototype, "image", {
            set: function (value) {
                texture2d_image.call(this, value);
                if (value && value.uuid && value.uuid.indexOf("://") > -1) {
                    this["$_$__remoteURL__"] = value.uuid;
                }
                else {
                    delete this["$_$__remoteURL__"];
                }
            },
            enumerable: true,
            configurable: true
        })

        //远程地址从 Texture2D 传给 SpriteFrame
        let spriteFrame_texture = getSetter(SpriteFrame, "texture");
        Object.defineProperty(SpriteFrame.prototype, "texture", {
            set: function (value) {
                spriteFrame_texture.call(this, value);
                if (value && value["$_$__remoteURL__"]) {
                    this["$_$__remoteURL__"] = value["$_$__remoteURL__"];
                    this._uuid = value["$_$__remoteURL__"];
                }
                else {
                    delete this["$_$__remoteURL__"];
                }
            },
            enumerable: true,
            configurable: true
        })

        Object.defineProperty(SpriteFrame.prototype, "destorySafe", {
            get: function () {
                if (!this["$_$__spriteDic__"]) {
                    return true;
                }
                if (this["$_$__spriteRef__"] === undefined || this["$_$__spriteRef__"] === 0) {
                    return true;
                }
                return false;
            },
            enumerable: true,
            configurable: true
        })

        Node.prototype.findSubComponent = function <T extends Component>(componentType: new (...parmas) => T, ...args): T[] {

            let arr = [];
            let obj = this.getComponent.call(this, componentType, ...args);
            if (obj) {
                arr.push(obj);
            }

            function loop(node) {
                if (node && node.children && node.children.length > 0) {
                    for (let i = 0; i < node.children.length; i++) {
                        let nodeObj = (node.children[i].getComponent.call(node.children[i], componentType, ...args));
                        if (nodeObj) {
                            arr.push(nodeObj);
                        }
                        loop(node.children[i]);
                    }
                }
            }

            loop(this);
            return arr;
        }

        const node_setParent = Node.prototype.setParent;
        Node.prototype.setParent = function setParent(value, keepWorldTransform) {
            //不能用 if(this.scene)来判断是否在场景上 this.scene 不会随着节点的 加载/移除 发生改变
            let oldStage = this.stage;
            let newStage;

            node_setParent.call(this, value, keepWorldTransform);

            newStage = this.stage;

            if (oldStage != newStage) {//场景发生了变化 有可能换了新场景 也有可能被加入场景成为可视节点  也有可能从场景上被移除出去
                let nodeList = [this];
                if (this.emit) this.emit(NodeEventType.STAGE_CHANGED);// node.stage 可以检测有无舞台

                function loop(node: Node) {
                    if (node.children && node.children.length > 0) {
                        for (let key in node.children) {
                            let subNode = node.children[key];
                            nodeList.push(subNode);
                            if (subNode.emit) subNode.emit(NodeEventType.STAGE_CHANGED);// node.stage 可以检测有无舞台
                            loop(subNode);
                        }
                    }
                }
                loop(this);

                for (let key in nodeList) {
                    let node = nodeList[key]
                    if (node.getComponent(Sprite) && node.getComponent(Sprite).spriteFrame) {
                        let sp = node.getComponent(Sprite);
                        let sf = node.getComponent(Sprite).spriteFrame;
                        if (!sf["$_$__onStageRef__"]) sf["$_$__onStageRef__"] = 0;
                        if (!sf["$_$__onStageDic__"]) sf["$_$__onStageDic__"] = {};
                        if (newStage && !sf["$_$__onStageDic__"][sp.uuid]) {
                            sf["$_$__onStageRef__"]++;
                            sf["$_$__onStageDic__"][sp.uuid] = 1;
                        }
                        else if (!newStage && sf["$_$__onStageDic__"][sp.uuid]) {
                            sf["$_$__onStageRef__"]--;
                            delete sf["$_$__onStageDic__"][sp.uuid];
                        }
                    }
                }
            }
        }



        //建议把getter/setter 变量写进 or.d.ts 下的 interface Node 中,便于在使用时带自动提示功能 
        //绕开UIOpacity  直接通过赋值修改Node的opacity(不透明度)
        Object.defineProperty(Node.prototype, "opacity", {
            get: function () {
                //没有UIOpacity? 那就自动创建一个
                return this.getOrAddComponent(UIOpacity).opacity;
            },
            set: function (value) {
                //没有UIOpacity? 那就自动创建一个
                this.getOrAddComponent(UIOpacity).opacity = value;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Node.prototype, "zIndex", {
            get: function () {
                //没有UIOpacity? 那就自动创建一个
                return this.getSiblingIndex();
            },
            set: function (value) {
                //没有UIOpacity? 那就自动创建一个
                this.setSiblingIndex(value);
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Node.prototype, "uiTransform", {
            get: function () {
                //没有UITransform? 那就自动创建一个
                return this.getOrAddComponent(UITransform);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Node.prototype, "nodeWidth", {
            get: function () {
                //没有UITransform? 那就自动创建一个
                return this.getOrAddComponent(UITransform).width;
            },
            set: function (value) {
                //没有UITransform? 那就自动创建一个
                this.getOrAddComponent(UITransform).width = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Node.prototype, "nodeHeight", {
            get: function () {
                //没有UITransform? 那就自动创建一个
                return this.getOrAddComponent(UITransform).height;
            },
            set: function (value) {
                //没有UITransform? 那就自动创建一个
                this.getOrAddComponent(UITransform).height = value;
            },
            enumerable: true,
            configurable: true
        });


        Object.defineProperty(Node.prototype, "x", {
            get: function () {
                return this.position.x;
            },
            set: function (value) {
                this.setPosition(value, this.position.y, this.position.z);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Node.prototype, "y", {
            get: function () {
                return this.position.y;
            },
            set: function (value) {
                this.setPosition(this.position.x, value, this.position.z);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Node.prototype, "z", {
            get: function () {
                return this.position.z;
            },
            set: function (value) {
                this.setPosition(this.position.x, this.position.y, value);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Node.prototype, "scaleX", {
            get: function () {
                return this.scale.x;
            },
            set: function (value) {
                this.setScale(value, this.scale.y, this.scale.z);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Node.prototype, "scaleY", {
            get: function () {
                return this.scale.y;
            },
            set: function (value) {
                this.setScale(this.scale.x, value, this.scale.z);
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Node.prototype, "scaleZ", {
            get: function () {
                return this.scale.z;
            },
            set: function (value) {
                this.setScale(this.scale.x, this.scale.y, value);
            },
            enumerable: true,
            configurable: true
        });


        //关于纹理集和子纹理的关系  主要体现在 SpriteAtlas 与 SpriteFrame
        //首先 SpriteFrame 的字段 name 就是 SpriteAtlas在资源库里的命名 , 而不是子纹理的命名
        //其次 SpriteFrame的uuid格式 就是 SpriteAtlas的uuid + @后缀    例如 SpriteFrame的uuid是e80e626f-66d8-47ed-afd6-a74a52d53b22@6c48a   那么SpriteAtlas的uuid就是去掉@6c48a后的 e80e626f-66d8-47ed-afd6-a74a52d53b22



        //覆盖 让 bundle.get("图片路径", SpriteFrame) 或 bundle.get("图片路径", Texture2D), 填入第二个具体类型参数时  返回一个 SpriteFrame 或 Texture2D,  而不是 ImageAsset
        AssetManager.Bundle.prototype.getInfoWithPath = function (path: string, type?: __private._types_globals__Constructor<Asset> | null): __private._cocos_asset_asset_manager_config__IAddressableInfo | null {
            if (path[path.length - 1] == "/") {
                path = path.substring(0, path.length - 1);
            }

            if (type == SpriteFrame) {//自动对应类型 补齐图片资源的后缀路径
                let arr = path.split("/");
                if (arr[arr.length - 1] !== "spriteFrame") {
                    path += "/spriteFrame";
                }
            }
            else if (type == Texture2D) {//自动对应类型 补齐图片资源的后缀路径
                let arr = path.split("/");
                if (arr[arr.length - 1] !== "texture") {
                    path += "/texture";
                }
            }

            return this._config.getInfoWithPath(path, type);
        }

        let sprite_destroy = Sprite.prototype.destroy;
        Sprite.prototype.destroy = function (): boolean {
            let bool = this.isValid;
            if (bool) {
                if (this.spriteFrame) {
                    let oldFrame = this["spriteFrame"];
                    if (!oldFrame["$_$__spriteRef__"]) oldFrame["$_$__spriteRef__"] = 0;
                    if (!oldFrame["$_$__spriteDic__"]) oldFrame["$_$__spriteDic__"] = {};
                    if (oldFrame["$_$__spriteDic__"][this.uuid]) {
                        oldFrame["$_$__spriteRef__"]--;
                        delete oldFrame["$_$__spriteDic__"][this.uuid];
                    }

                    if (!oldFrame["$_$__onStageRef__"]) oldFrame["$_$__onStageRef__"] = 0;
                    if (!oldFrame["$_$__onStageDic__"]) oldFrame["$_$__onStageDic__"] = {};
                    if (oldFrame["$_$__onStageDic__"][this.uuid]) {
                        oldFrame["$_$__onStageRef__"]--;
                        delete oldFrame["$_$__onStageDic__"][this.uuid];
                    }

                    if (!oldFrame["$_$__activeRef__"]) oldFrame["$_$__activeRef__"] = 0;
                    if (!oldFrame["$_$__activeDic__"]) oldFrame["$_$__activeDic__"] = {};
                    if (oldFrame["$_$__activeDic__"][this.uuid]) {
                        oldFrame["$_$__activeRef__"]--;
                        delete oldFrame["$_$__activeDic__"][this.uuid];
                    }

                    if (this["$_$__prefabSprite__"]) {
                        if (oldFrame["$_$__prefabDic__"][this["$_$__prefabSprite__"]]) {
                            if (oldFrame["$_$__prefabRef__"] && oldFrame["$_$__prefabRef__"] > 0) {
                                oldFrame["$_$__prefabRef__"]--;
                            }
                            delete oldFrame["$_$__prefabDic__"][this["$_$__prefabSprite__"]];
                        }
                    }

                    delete this["$_$__prefabSprite__"];
                    this["spriteFrame"] = null;
                }
            }
            return sprite_destroy.call(this);
        }

        let spriteFrame_destroy = SpriteFrame.prototype.destroy;
        SpriteFrame.prototype.destroy = function (): boolean {
            let key = "";
            if (this["$_$__remoteURL__"]) {
                key = "EngineOverrider.remoteSpriteFrameCache['" + this["$_$__remoteURL__"] + "']";
            }
            else {
                key = "cc.assetManager.assets.get('" + this._uuid + "')";
            }
            if (this["$_$__prefabDic__"] && Object.keys(this["$_$__prefabDic__"]).length > 0) {
                console.warn("SpriteFrame实例 目前仍然被其他预制体所依赖, 不能安全销毁, 请使用forceDestroy(), 强制解除所有引用并执行销毁\n(复制↓↓↓↓↓↓\n" + key + "\n粘贴到控制台可以获得其引用信息)");
                return false;
            }

            if (this["$_$__spriteDic__"] && Object.keys(this["$_$__spriteDic__"]).length > 0) {
                console.warn("SpriteFrame实例 目前仍然被其他Sprite所引用, 不能安全销毁, 请使用forceDestroy(), 强制解除所有引用并执行销毁\n(复制↓↓↓↓↓↓\n" + key + "\n粘贴到控制台可以获得其引用信息)");
                return false;
            }



            /* if (this["$_$__spriteDic__"] && Object.keys(this["$_$__spriteDic__"]).length > 0) {
                for (let key in this["$_$__spriteDic__"]) {
                    this["$_$__spriteDic__"][key].spriteFrame = null;
                    this["$_$__spriteDic__"][key] = null;
                }
                this["$_$__spriteDic__"] = null;
                this["_ref"] = 0;
            } */
            if (this["uuid"] !== undefined && EngineOverrider.remoteSpriteFrameCache[this["uuid"]]) {//从本地缓存库移除
                delete EngineOverrider.remoteSpriteFrameCache[this["uuid"]];
            }
            if (this["$_$__remoteURL__"] !== undefined && EngineOverrider.remoteSpriteFrameCache[this["$_$__remoteURL__"]]) {//从本地缓存库移除
                delete EngineOverrider.remoteSpriteFrameCache[this["$_$__remoteURL__"]];
                this._uuid = this["$_$__remoteURL__"];//creator的清理内存机制会在destroy之后,异步清空白名单以外的字段  _uuid字段则在白名单之内
            }
            return spriteFrame_destroy.call(this);
        }

        SpriteFrame.prototype.forceDestroy = function (): boolean {
            if (!this.isValid) return false;//已被销毁
            if (this["$_$__spriteDic__"] && Object.keys(this["$_$__spriteDic__"]).length > 0) {
                for (let key in this["$_$__spriteDic__"]) {
                    this["$_$__spriteDic__"][key].spriteFrame = null;
                    this["$_$__spriteDic__"][key] = null;
                }
                this["$_$__spriteDic__"] = null;
                this["_ref"] = 0;
            }
            if (this["uuid"] !== undefined && EngineOverrider.remoteSpriteFrameCache[this["uuid"]]) {//从本地缓存库移除
                delete EngineOverrider.remoteSpriteFrameCache[this["uuid"]];
            }
            if (this["$_$__remoteURL__"] !== undefined && EngineOverrider.remoteSpriteFrameCache[this["$_$__remoteURL__"]]) {//从本地缓存库移除
                delete EngineOverrider.remoteSpriteFrameCache[this["$_$__remoteURL__"]];
                this._uuid = this["$_$__remoteURL__"];//creator的清理内存机制会在destroy之后,异步清空白名单以外的字段  _uuid字段则在白名单之内
            }

            return spriteFrame_destroy.call(this);
        }


        let node_destroy = Node.prototype.destroy;
        //销毁节点时,顺带销毁节点上的Sprite组件, 触发组件的引用计数变更
        Node.prototype.destroy = function (): boolean {
            let bool = this.isValid;
            if (bool) {
                let sprite = this.getComponent(Sprite);
                if (sprite) {
                    sprite.destroy();
                }
            }
            return node_destroy.call(this);
        }


        //在Sprite初始化的时候 统计spriteFrame被所有Sprite引用的次数  被字典或数组储存的spriteFrame 不会被统计进来
        Sprite.prototype["_updateBuiltinMaterial"] = function () {
            let mat = UIRenderer.prototype["_updateBuiltinMaterial"]();
            ///=↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓新增↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓


            let sf: SpriteFrame = this.spriteFrame;
            let stage = null;
            if (this.node) {
                stage = this.node.stage;
            }
            if (sf) {
                if (DEBUG) {
                    sf["$_$__debugDes__"] = {
                        描述: {
                            1: '关于SpriteFrame自定义自动引用计数 $_$__xxxxRef 字段的解释(该说明仅在DEBUG版本可见):',
                            2: '为了避免SpriteFrame繁琐的自增自减操作(addRef和decRef), 采用自动统计策略 为此, 重写了一些底层方法, 但并不与 addRef和decRef 冲突',
                            3: '$_$__spriteRef__ 表示该SpriteFrame当前总共被几个Sprite组件(包括预制体上的Sprite)所引用 并使用 字典对象$_$__spriteDic__ 保存Sprite组件引用 (当销毁该SpriteFrame时, 所有Sprite组件的引用都会自动清空)',
                            4: '$_$__activeRef__ 表示引用该SpriteFrame的Sprite组件所在节点 目前总共有几个正处于激活状态 并使用 字典对象$_$__activeDic__ 保存Sprite组件的uuid',
                            5: '$_$__onStageRef__ 表示引用该SpriteFrame的Sprite组件所在节点 目前总共有几个出现在场景里 并使用 字典对象$_$__onStageDic__ 保存Sprite组件的uuid',
                            6: '如果该SpriteFrame被预制体的Sprite组件所引用、并且该预制体已被加载进assetManager.assets字典(发生依赖), 会添加一个 $_$__prefabRef__ 字段表示当前总共被几个预制体依赖 并使用 字典对象$_$__prefabDic__ 保存预制体的uuid',
                            7: '如果该SpriteFrame的纹理来自远程库的图片,会添加一个 $_$__remoteURL__ 字段记录远程图片资源的位置',
                            8: '※理论上$_$__onStageRef__ 或 $_$__activeRef__ 的值任何时候都不应该大于 $_$__spriteRef__',
                            9: '※根据creator的循环渲染机制 当引用了该SpriteFrame的所有Sprite组件的节点 当前都没有出现在场景上或都没有被激活时(也就是同时存在于$_$__onStageDic__ 和 $_$__activeDic__字典的uuid总和为0时) 才可以通过destroy()安全销毁该SpriteFrame',
                            10: '另外为SpriteFrame类提供了一个destorySafe字段 用于判断该SpriteFrame当前是否可以被销毁和释放(要保证引用该SpriteFrame的Sprite组件所在的节点 不会再次被加载进场景或再次被激活,否则仍然会报错 最好是让 Sprite组件.spriteFrame = 其他值 或销毁Sprite组件)',
                            11: '※建议: 当$_$__spriteRef__的值为0时 才是最安全的销毁时机, 或者使用SpriteFrame类的forceDestroy()方法 强制解除所有引用和依赖关系,并自我销毁'
                        }
                    }
                }

                if (!sf["$_$__spriteRef__"]) sf["$_$__spriteRef__"] = 0
                if (!sf["$_$__spriteDic__"]) sf["$_$__spriteDic__"] = {};
                if (!sf["$_$__spriteDic__"][this.uuid]) {
                    sf["$_$__spriteRef__"]++;
                    sf["$_$__spriteDic__"][this.uuid] = this;
                }

                if (!sf["$_$__onStageRef__"]) sf["$_$__onStageRef__"] = 0;
                if (!sf["$_$__onStageDic__"]) sf["$_$__onStageDic__"] = {};
                if (stage && !sf["$_$__onStageDic__"][this.uuid]) {
                    sf["$_$__onStageRef__"]++;
                    sf["$_$__onStageDic__"][this.uuid] = 1;
                }
                else if (!stage && sf["$_$__onStageDic__"][this.uuid]) {
                    sf["$_$__onStageRef__"]--;
                    delete sf["$_$__onStageDic__"][this.uuid];
                }

                if (!sf["$_$__activeRef__"]) sf["$_$__activeRef__"] = 0;
                if (!sf["$_$__activeDic__"]) sf["$_$__activeDic__"] = {};
                if (this.node.active && !sf["$_$__activeDic__"][this.uuid]) {
                    sf["$_$__activeRef__"]++;
                    sf["$_$__activeDic__"][this.uuid] = 1;
                }
                else if (!this.node.active && sf["$_$__activeDic__"][this.uuid]) {
                    sf["$_$__activeRef__"]--;
                    delete sf["$_$__activeDic__"][this.uuid];
                }
            }
            ///=↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑新增↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑
            if (this.spriteFrame && this.spriteFrame.texture instanceof RenderTexture) {
                const defines = { SAMPLE_FROM_RT: true, ...mat.passes[0].defines };
                const renderMat = new Material();
                renderMat.initialize({
                    effectAsset: mat.effectAsset,
                    defines,
                });
                mat = renderMat;
            }
            return mat;
        }



        //creator 3.x 有个坑爹的地方: 场景里带有Camera子节点的所有Canvas主节点 全部都被设置 acvite=false 时, 至少有一个不会被隐藏, 仍然处于循环渲染队列中  此时销毁节点上的 SpriteFrame 会报错
        function cheackNodeAcviteWhileWithCanvas(baseNode: Node): boolean {
            if (!baseNode) {
                return false;
            }

            //if(baseNode)

            return true;
        }

        function cheackAllParentsAcvite(baseNode: Node): boolean {
            if (!baseNode) {
                return false;
            }
            if (baseNode)
                return true;
        }

        let SpriteType = { 0: 'SIMPLE', 1: 'SLICED', 2: 'TILED', 3: 'FILLED', SIMPLE: 0, SLICED: 1, TILED: 2, FILLED: 3 };
        //在Sprite变更spriteFrame的时候 统计spriteFrame被所有Sprite引用的次数  被字典或数组储存的spriteFrame 不会被统计进来
        Sprite.prototype["_applySpriteFrame"] = function (oldFrame: SpriteFrame | null) {
            const spriteFrame = this._spriteFrame;

            ///=↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓新增↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓↓
            if (oldFrame) {
                if (!oldFrame["$_$__spriteRef__"]) oldFrame["$_$__spriteRef__"] = 0;
                if (!oldFrame["$_$__spriteDic__"]) oldFrame["$_$__spriteDic__"] = {};
                if (oldFrame["$_$__spriteDic__"][this.uuid]) {
                    oldFrame["$_$__spriteRef__"]--;
                    delete oldFrame["$_$__spriteDic__"][this.uuid];
                }

                if (!oldFrame["$_$__onStageRef__"]) oldFrame["$_$__onStageRef__"] = 0;
                if (!oldFrame["$_$__onStageDic__"]) oldFrame["$_$__onStageDic__"] = {};
                if (oldFrame["$_$__onStageDic__"][this.uuid]) {
                    oldFrame["$_$__onStageRef__"]--;
                    delete oldFrame["$_$__onStageDic__"][this.uuid];
                }

                if (!oldFrame["$_$__activeRef__"]) oldFrame["$_$__activeRef__"] = 0;
                if (!oldFrame["$_$__activeDic__"]) oldFrame["$_$__activeDic__"] = {};
                if (oldFrame["$_$__activeDic__"][this.uuid]) {
                    oldFrame["$_$__activeRef__"]--;
                    delete oldFrame["$_$__activeDic__"][this.uuid];
                }

                if (this["$_$__prefabSprite__"]) {
                    if (oldFrame["$_$__prefabDic__"][this["$_$__prefabSprite__"]]) {
                        if (oldFrame["$_$__prefabRef__"] && oldFrame["$_$__prefabRef__"] > 0) {
                            oldFrame["$_$__prefabRef__"]--;
                        }
                        delete oldFrame["$_$__prefabDic__"][this["$_$__prefabSprite__"]];
                    }
                }


            }
            if (spriteFrame) {
                if (!spriteFrame["$_$__spriteRef__"]) spriteFrame["$_$__spriteRef__"] = 0;
                if (!spriteFrame["$_$__spriteDic__"]) spriteFrame["$_$__spriteDic__"] = {};
                if (!spriteFrame["$_$__spriteDic__"][this.uuid]) {
                    spriteFrame["$_$__spriteRef__"]++;
                    spriteFrame["$_$__spriteDic__"][this.uuid] = this;
                }

                if (!spriteFrame["$_$__onStageRef__"]) spriteFrame["$_$__onStageRef__"] = 0;
                if (!spriteFrame["$_$__onStageDic__"]) spriteFrame["$_$__onStageDic__"] = {};
                if (this.node && this.node.stage && !spriteFrame["$_$__onStageDic__"][this.uuid]) {
                    spriteFrame["$_$__onStageRef__"]++;
                    spriteFrame["$_$__onStageDic__"][this.uuid] = 1;
                }

                if (!spriteFrame["$_$__activeRef__"]) spriteFrame["$_$__activeRef__"] = 0;
                if (!spriteFrame["$_$__activeDic__"]) spriteFrame["$_$__activeDic__"] = {};
                if (this.node.active && !spriteFrame["$_$__activeDic__"][this.uuid]) {
                    spriteFrame["$_$__activeRef__"]++;
                    spriteFrame["$_$__activeDic__"][this.uuid] = 1;
                }

                if (this["$_$__prefabSprite__"]) {
                    if (!spriteFrame["$_$__prefabRef__"]) spriteFrame["$_$__prefabRef__"] = 0;
                    if (!spriteFrame["$_$__prefabDic__"]) spriteFrame["$_$__prefabDic__"] = {};
                    if (!spriteFrame["$_$__prefabDic__"][this["$_$__prefabSprite__"]]) {
                        spriteFrame["$_$__prefabRef__"]++;
                        spriteFrame["$_$__prefabDic__"][this["$_$__prefabSprite__"]] = 1;
                    }
                }
            }
            ///=↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑新增↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑↑

            if (oldFrame && this._type === SpriteType.SLICED) {
                oldFrame.off(SpriteFrame.EVENT_UV_UPDATED, this._updateUVs, this);
            }

            let textureChanged = false;
            if (spriteFrame) {
                if (!oldFrame || oldFrame.texture !== spriteFrame.texture) {
                    textureChanged = true;
                }
                if (textureChanged) {
                    if (this.renderData) this.renderData.textureDirty = true;
                    this.changeMaterialForDefine();
                }
                this._applySpriteSize();
                if (this._type === SpriteType.SLICED) {
                    spriteFrame.on(SpriteFrame.EVENT_UV_UPDATED, this._updateUVs, this);
                }
            }
        }

        /* let scene_activate = Scene.prototype["_activate"];
        Scene.prototype["_activate"] = function () {
            scene_activate.call(this);

            let nodeList = [];
            

            function loop(node: Node) {
                if (node.children && node.children.length > 0) {
                    for (let key in node.children) {
                        let subNode = node.children[key];
                        nodeList.push(subNode);
                        if (subNode.emit) subNode.emit(NodeEventType.STAGE_CHANGED);// node.stage 可以检测有无舞台
                        loop(subNode);
                    }
                }
            }
            loop(this);


            for (let key in nodeList) {
                let node = nodeList[key]
                let stage = node.stage;
                if (stage && node.getComponent(Sprite) && node.getComponent(Sprite).spriteFrame) {
                    let sp = node.getComponent(Sprite);
                    let sf = node.getComponent(Sprite).spriteFrame;
                    if (!sf["$_$__onStageRef__"]) sf["$_$__onStageRef__"] = 0;
                    if (!sf["$_$__onStageDic__"]) sf["$_$__onStageDic__"] = {};
                    if (!sf["$_$__onStageDic__"][sp.uuid]) {
                        sf["$_$__onStageRef__"]++;
                        sf["$_$__onStageDic__"][sp.uuid] = 1;
                    }
                    else if (!stage && sf["$_$__onStageDic__"][sp.uuid]) {
                        sf["$_$__onStageRef__"]--;
                        delete sf["$_$__onStageDic__"][sp.uuid];
                    }
                }
            }
        }  */

    }
}
if (EngineOverrider.startWrite) {
    EngineOverrider.startWrite();
    EngineOverrider.startWrite = null;//执行完一次后置空 不再重复覆盖
}


if (debug) {
    window["EngineOverrider"] = EngineOverrider;
}



