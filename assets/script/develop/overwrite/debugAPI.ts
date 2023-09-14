import { Asset, assetManager, find, Sprite, SpriteFrame, Node } from "cc";
import { DEBUG } from "cc/env";
import { asyncAsset } from "../mgr/asyncAsset";

class debugAPI {
    public static startWrite() {
        if (!DEBUG) {
            return;
        }

        //debug模式下 控制台输入 $ca 就可以获得当前场景的Canvas
        Object.defineProperty(globalThis.constructor.prototype, "$ca", {
            get: function () {
                return find("Canvas");
            },
            enumerable: true,
            configurable: true
        })

        /** 创建一个带有 Sprite组件的节点 */
        globalThis["$spNode"] = (assetInfo: { res: string, url: string, type: new () => Asset }): Node => {
            if (!assetInfo.type || assetInfo.type !== SpriteFrame) {
                return null;
            }
            let _newNode = new window["cc"]["Node"]();
            _newNode.addComponent(Sprite);
            return _newNode;
        }
        globalThis["$am"] = assetManager;
        globalThis["$aa"] = asyncAsset;
        globalThis["$ala"] = asyncAsset.bundleLoadOneAsset;
        globalThis["$alu"] = asyncAsset.bundleLoadAllUsingAssets;
    }
}
debugAPI.startWrite();





