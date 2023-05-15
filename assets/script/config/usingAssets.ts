/** created by usingAssetExport_3x.py */
//asset目录下所有被设置为'Bundle'的文件夹, 里面资源都会被注册进来
import { AnimationClip, LabelAtlas, Font, SpriteAtlas, SpriteFrame, Prefab, VideoClip, AudioClip, sp, dragonBones, JsonAsset, TextAsset, Asset } from "cc";

/*
目前3.6版本发现的规律
	所有资源加载后储存在字典 assetManager.assets 里面, 每个资源生成一个对应的AssetInfo, AssetInfo的uuid就是该资源的key;  使用 bundle.get(path, type) 将尝试匹配对应的AssetInfo, 然后通过它的uuid在assetManager.assets里查找资源
	bundle.load('图片相对路径', SpriteFrame) 或 bundle.load('图片相对路径', Texture2D)  只能获得 ImageAsset, 类型参数 SpriteFrame 根本没用(这个在官方文档有说明)
	bundle.load('图片相对路径' + '/spriteFrame')  将获得 SpriteFrame, 不需要类型参数 SpriteFrame
	bundle.load('图片相对路径' + '/texture')  将获得 Texture2D, 不需要类型参数 Texture2D
	assetManager.loadAny(图片uuid + '@6c48a')  将在回调方法里获得 Texture2D   (或者使用更暴力的方式同步获取 assetManager.assets._map[图片uuid + '@6c48a'])
	assetManager.loadAny(图片uuid + '@f9941')  将在回调方法里获得 SpriteFrame   (或者使用更暴力的方式同步获取 assetManager.assets._map[图片uuid + '@f9941'])
	texturePack打包图集, 配置文件与png文件去掉后缀名之后路径相同, 因此使用 bundle.load 加载时必须声明 SpriteAtlas, 否则加载的就是 ImageAsset
	spine动画 json配置文件与png文件去掉后缀路径相同, 因此加载时必须声明 sp.SkeletonData, 否则加载的就是 ImageAsset   龙骨动画则不用(因为json与png去掉后缀 路径也不同名)
*/

export const usingAssets = {
	pic: {
		big_daofengyizhi_png: { bundle: "pic", url: "big_daofengyizhi", ext: ".png", type: SpriteFrame, uuid: "efmiuL2v9Eebl2ozI0hh+j" },
		big_huawang_png: { bundle: "pic", url: "big_huawang", ext: ".png", type: SpriteFrame, uuid: "44xlsgZwJPDLZ0Af4xEkVL" },
		big_qinsexiannv_png: { bundle: "pic", url: "big_qinsexiannv", ext: ".png", type: SpriteFrame, uuid: "61rnZzjBdBOoufC9Esu6wv" },
		big_shengguangjisi_png: { bundle: "pic", url: "big_shengguangjisi", ext: ".png", type: SpriteFrame, uuid: "77u9oNvnZEEptwIcMdJFUn" },
		big_shuguangnvshen_png: { bundle: "pic", url: "big_shuguangnvshen", ext: ".png", type: SpriteFrame, uuid: "9bt9XFsHFFtacoEm5K6cKB" },
		big_zhanzhengzhinv_png: { bundle: "pic", url: "big_zhanzhengzhinv", ext: ".png", type: SpriteFrame, uuid: "3cDJd25J5GLpUIoCLlHVJn" },
		zxnn_main_atlas_plist: { bundle: "pic", url: "zxnn_main_atlas", ext: ".plist", type: SpriteAtlas, uuid: "ecavh1vidBpJK+BgQuhI/e" },
		zxnn_main_atlas_png: { bundle: "pic", url: "zxnn_main_atlas", ext: ".png", type: SpriteFrame, uuid: "e8DmJvZthH7a/Wp0pS1Tsi" }
	}
}
globalThis["usingAssets"] = usingAssets;


export const usingBundles = {
	pic: "",
}
globalThis["usingBundles"] = usingBundles;