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
	atlas: {
		girlTexture0_plist: { bundle: "atlas", url: "girlTextures/girlTexture0", ext: ".plist", type: SpriteAtlas, uuid: "9dt6QaaB5ETrvnGgDJ3MIk" },
		girlTexture0_png: { bundle: "atlas", url: "girlTextures/girlTexture0", ext: ".png", type: SpriteFrame, uuid: "cfW+XC0bBIsILJSmkRv8ZM" },
		girlTexture1_plist: { bundle: "atlas", url: "girlTextures/girlTexture1", ext: ".plist", type: SpriteAtlas, uuid: "0b8ALpeyxCNIwDgbgXE6dF" },
		girlTexture1_png: { bundle: "atlas", url: "girlTextures/girlTexture1", ext: ".png", type: SpriteFrame, uuid: "b0I2lFh+1PpbjXBZqQhKq0" },
		girlTexture2_plist: { bundle: "atlas", url: "girlTextures/girlTexture2", ext: ".plist", type: SpriteAtlas, uuid: "c8mHwu5+FMrrIEoJ9L5fSY" },
		girlTexture2_png: { bundle: "atlas", url: "girlTextures/girlTexture2", ext: ".png", type: SpriteFrame, uuid: "68JsDOYTNAPYM5RHIR+L9d" },
		girlTexture3_plist: { bundle: "atlas", url: "girlTextures/girlTexture3", ext: ".plist", type: SpriteAtlas, uuid: "74i9CWvFxKQJzrPIFRxWzw" },
		girlTexture3_png: { bundle: "atlas", url: "girlTextures/girlTexture3", ext: ".png", type: SpriteFrame, uuid: "0bDkPVXs5B9rSu4upiXFsK" },
		girlTexture4_plist: { bundle: "atlas", url: "girlTextures/girlTexture4", ext: ".plist", type: SpriteAtlas, uuid: "39cSXjW+hKurwZQF74Mgd8" },
		girlTexture4_png: { bundle: "atlas", url: "girlTextures/girlTexture4", ext: ".png", type: SpriteFrame, uuid: "2dLPWupylN47RmmeOxySeX" },
		girlTexture5_plist: { bundle: "atlas", url: "girlTextures/girlTexture5", ext: ".plist", type: SpriteAtlas, uuid: "4bVGaXLrROqJ2wN3KmKx31" },
		girlTexture5_png: { bundle: "atlas", url: "girlTextures/girlTexture5", ext: ".png", type: SpriteFrame, uuid: "a8TnoLEShFKYSwO9dU5x7j" },
		girlTexture6_plist: { bundle: "atlas", url: "girlTextures/girlTexture6", ext: ".plist", type: SpriteAtlas, uuid: "3bx3q7hdpEup24eyPaGRe2" },
		girlTexture6_png: { bundle: "atlas", url: "girlTextures/girlTexture6", ext: ".png", type: SpriteFrame, uuid: "e6bKkDXfhMb4N5bMYFOcdo" },
		girlTexture7_plist: { bundle: "atlas", url: "girlTextures/girlTexture7", ext: ".plist", type: SpriteAtlas, uuid: "a24DFyi8pOrrStNT2OqN8E" },
		girlTexture7_png: { bundle: "atlas", url: "girlTextures/girlTexture7", ext: ".png", type: SpriteFrame, uuid: "96Ax4C3eRBUqaVK6H7xxn1" },
		girlTexture8_plist: { bundle: "atlas", url: "girlTextures/girlTexture8", ext: ".plist", type: SpriteAtlas, uuid: "b227VUcA1F8YBo2u5NsHzk" },
		girlTexture8_png: { bundle: "atlas", url: "girlTextures/girlTexture8", ext: ".png", type: SpriteFrame, uuid: "6d7kI6xDlFk4hYzkMnCx4s" }
	},
	image: {
		big_daofengyizhi_png: { bundle: "image", url: "big_daofengyizhi", ext: ".png", type: SpriteFrame, uuid: "efmiuL2v9Eebl2ozI0hh+j" },
		big_huawang_png: { bundle: "image", url: "big_huawang", ext: ".png", type: SpriteFrame, uuid: "44xlsgZwJPDLZ0Af4xEkVL" },
		big_qinsexiannv_png: { bundle: "image", url: "big_qinsexiannv", ext: ".png", type: SpriteFrame, uuid: "61rnZzjBdBOoufC9Esu6wv" },
		big_shengguangjisi_png: { bundle: "image", url: "big_shengguangjisi", ext: ".png", type: SpriteFrame, uuid: "77u9oNvnZEEptwIcMdJFUn" },
		big_shuguangnvshen_png: { bundle: "image", url: "big_shuguangnvshen", ext: ".png", type: SpriteFrame, uuid: "9bt9XFsHFFtacoEm5K6cKB" },
		big_zhanzhengzhinv_png: { bundle: "image", url: "big_zhanzhengzhinv", ext: ".png", type: SpriteFrame, uuid: "3cDJd25J5GLpUIoCLlHVJn" },
		zxnn_main_atlas_plist: { bundle: "image", url: "zxnn_main_atlas", ext: ".plist", type: SpriteAtlas, uuid: "ecavh1vidBpJK+BgQuhI/e" },
		zxnn_main_atlas_png: { bundle: "image", url: "zxnn_main_atlas", ext: ".png", type: SpriteFrame, uuid: "e8DmJvZthH7a/Wp0pS1Tsi" }
	},
	prefab: {
		prefab_png_prefab: { bundle: "prefab", url: "prefab_png", ext: ".prefab", type: Prefab, uuid: "5dpTEMX1xFarphdV1o+8fu" }
	}
}
globalThis["usingAssets"] = usingAssets;


export const usingBundles = {
	atlas: "atlas",
	image: "image",
	prefab: "prefab",
}
globalThis["usingBundles"] = usingBundles;