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
		girlTextures_girlTexture0_plist: { bundle: "atlas", url: "girlTextures/girlTexture0", ext: ".plist", type: SpriteAtlas, uuid: "9db7a41a-681e-444e-bbe7-1a00c9dcc224" },
		girlTextures_girlTexture0_png: { bundle: "atlas", url: "girlTextures/girlTexture0", ext: ".png", type: SpriteFrame, uuid: "cf5be5c2-d1b0-48b0-82c9-4a6911bfc64c" },
		girlTextures_girlTexture1_png: { bundle: "atlas", url: "girlTextures/girlTexture1", ext: ".png", type: SpriteFrame, uuid: "b0236945-87ed-4fa5-b8d7-059a9084aab4" },
		girlTextures_girlTexture1_plist: { bundle: "atlas", url: "girlTextures/girlTexture1", ext: ".plist", type: SpriteAtlas, uuid: "0bf002e9-7b2c-4234-8c03-81b81713a745" },
		girlTextures_girlTexture2_plist: { bundle: "atlas", url: "girlTextures/girlTexture2", ext: ".plist", type: SpriteAtlas, uuid: "c8987c2e-e7e1-4cae-b204-a09f4be5f498" },
		girlTextures_girlTexture3_plist: { bundle: "atlas", url: "girlTextures/girlTexture3", ext: ".plist", type: SpriteAtlas, uuid: "748bd096-bc5c-4a40-9ceb-3c8151c56cf0" },
		girlTextures_girlTexture2_png: { bundle: "atlas", url: "girlTextures/girlTexture2", ext: ".png", type: SpriteFrame, uuid: "6826c0ce-6133-403d-8339-447211f8bf5d" },
		girlTextures_girlTexture3_png: { bundle: "atlas", url: "girlTextures/girlTexture3", ext: ".png", type: SpriteFrame, uuid: "0b0e43d5-5ece-41f6-b4ae-e2ea625c5b0a" },
		girlTextures_girlTexture4_png: { bundle: "atlas", url: "girlTextures/girlTexture4", ext: ".png", type: SpriteFrame, uuid: "2d2cf5ae-a729-4de3-b466-99e3b1c92797" },
		girlTextures_girlTexture5_plist: { bundle: "atlas", url: "girlTextures/girlTexture5", ext: ".plist", type: SpriteAtlas, uuid: "4b546697-2eb4-4ea8-9db0-3772a62b1df5" },
		girlTextures_girlTexture5_png: { bundle: "atlas", url: "girlTextures/girlTexture5", ext: ".png", type: SpriteFrame, uuid: "a84e7a0b-1128-4529-84b0-3bd754e71ee3" },
		girlTextures_girlTexture4_plist: { bundle: "atlas", url: "girlTextures/girlTexture4", ext: ".plist", type: SpriteAtlas, uuid: "397125e3-5be8-4aba-bc19-405ef832077c" },
		girlTextures_girlTexture6_plist: { bundle: "atlas", url: "girlTextures/girlTexture6", ext: ".plist", type: SpriteAtlas, uuid: "3bc77abb-85da-44ba-9db8-7b23da1917b6" },
		girlTextures_girlTexture6_png: { bundle: "atlas", url: "girlTextures/girlTexture6", ext: ".png", type: SpriteFrame, uuid: "e66ca903-5df8-4c6f-8379-6cc60539c768" },
		girlTextures_girlTexture7_png: { bundle: "atlas", url: "girlTextures/girlTexture7", ext: ".png", type: SpriteFrame, uuid: "96031e02-dde4-4152-a695-2ba1fbc719f5" },
		girlTextures_girlTexture8_plist: { bundle: "atlas", url: "girlTextures/girlTexture8", ext: ".plist", type: SpriteAtlas, uuid: "b2dbb554-700d-45f1-8068-daee4db07ce4" },
		girlTextures_girlTexture7_plist: { bundle: "atlas", url: "girlTextures/girlTexture7", ext: ".plist", type: SpriteAtlas, uuid: "a2e03172-8bca-4eae-b4ad-353d8ea8df04" },
		girlTextures_girlTexture8_png: { bundle: "atlas", url: "girlTextures/girlTexture8", ext: ".png", type: SpriteFrame, uuid: "6dee423a-c439-4593-8858-ce43270b1e2c" },
	},
	image: {
		big_shengguangjisi_png: { bundle: "image", url: "big_shengguangjisi", ext: ".png", type: SpriteFrame, uuid: "77bbda0d-be76-4412-9b70-21c31d245527" },
		big_huawang_png: { bundle: "image", url: "big_huawang", ext: ".png", type: SpriteFrame, uuid: "44c65b20-6702-4f0c-b674-01fe3112454b" },
		big_daofengyizhi_png: { bundle: "image", url: "big_daofengyizhi", ext: ".png", type: SpriteFrame, uuid: "ef9a2b8b-daff-4479-b976-a33234861fa3" },
		big_qinsexiannv_png: { bundle: "image", url: "big_qinsexiannv", ext: ".png", type: SpriteFrame, uuid: "61ae7673-8c17-413a-8b9f-0bd12cbbac2f" },
		big_shuguangnvshen_png: { bundle: "image", url: "big_shuguangnvshen", ext: ".png", type: SpriteFrame, uuid: "9bb7d5c5-b071-45b5-a728-126e4ae9c281" },
		big_zhanzhengzhinv_png: { bundle: "image", url: "big_zhanzhengzhinv", ext: ".png", type: SpriteFrame, uuid: "3c0c9776-e49e-462e-9508-a022e51d5267" },
		zxnn_main_atlas_plist: { bundle: "image", url: "zxnn_main_atlas", ext: ".plist", type: SpriteAtlas, uuid: "ec6af875-be27-41a4-92be-06042e848fde" },
		zxnn_main_atlas_png: { bundle: "image", url: "zxnn_main_atlas", ext: ".png", type: SpriteFrame, uuid: "e80e626f-66d8-47ed-afd6-a74a52d53b22" },
	},
	prefab: {
		prefab_png_prefab: { bundle: "prefab", url: "prefab_png", ext: ".prefab", type: Prefab, uuid: "5da5310c-5f5c-456a-ba61-755d68fbc7ee" },
	}
}

globalThis["usingAssets"] = usingAssets;


export const usingBundles = {
	atlas: "atlas",
	image: "image",
	prefab: "prefab",
	swf: "swf",
}
globalThis["usingBundles"] = usingBundles;