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
		girlTextures_girlTexture0_plist: { bundle: "atlas", url: "girlTextures/girlTexture0", ext: ".plist", type: SpriteAtlas, uuid: "2de72a46-faf5-4f68-8959-5f5a4a291e73" },
		girlTextures_girlTexture0_png: { bundle: "atlas", url: "girlTextures/girlTexture0", ext: ".png", type: SpriteFrame, uuid: "b92b6eb4-b87b-4f3e-9320-d1d892ecbb8d" },
		girlTextures_girlTexture1_plist: { bundle: "atlas", url: "girlTextures/girlTexture1", ext: ".plist", type: SpriteAtlas, uuid: "9eb4390d-1e50-45a6-820c-cd0b9b241998" },
		girlTextures_girlTexture1_png: { bundle: "atlas", url: "girlTextures/girlTexture1", ext: ".png", type: SpriteFrame, uuid: "16886990-2858-4649-bbf8-167f9b6e9e63" },
		girlTextures_girlTexture2_plist: { bundle: "atlas", url: "girlTextures/girlTexture2", ext: ".plist", type: SpriteAtlas, uuid: "3f531af2-8918-4170-a0f3-63765270ef32" },
		girlTextures_girlTexture2_png: { bundle: "atlas", url: "girlTextures/girlTexture2", ext: ".png", type: SpriteFrame, uuid: "de194bb5-30c6-4d36-8dda-690c123e2c97" },
		girlTextures_girlTexture3_plist: { bundle: "atlas", url: "girlTextures/girlTexture3", ext: ".plist", type: SpriteAtlas, uuid: "9f4fa0fb-e7e8-4fe2-8dee-0ea3cd9fe469" },
		girlTextures_girlTexture3_png: { bundle: "atlas", url: "girlTextures/girlTexture3", ext: ".png", type: SpriteFrame, uuid: "89cee6fd-1d49-431a-adae-fb29a394252a" },
		girlTextures_girlTexture4_plist: { bundle: "atlas", url: "girlTextures/girlTexture4", ext: ".plist", type: SpriteAtlas, uuid: "c17b9f48-fc6a-4f85-9b29-6f624b933ef6" },
		girlTextures_girlTexture4_png: { bundle: "atlas", url: "girlTextures/girlTexture4", ext: ".png", type: SpriteFrame, uuid: "45f11726-7a78-48a3-a903-0d7e3d40fb01" },
		girlTextures_girlTexture5_plist: { bundle: "atlas", url: "girlTextures/girlTexture5", ext: ".plist", type: SpriteAtlas, uuid: "7d1a99c7-d9ba-46ef-8c32-b51851febd65" },
		girlTextures_girlTexture5_png: { bundle: "atlas", url: "girlTextures/girlTexture5", ext: ".png", type: SpriteFrame, uuid: "7ddc8487-86e9-4cda-becd-1a3d153854e6" },
		girlTextures_girlTexture6_plist: { bundle: "atlas", url: "girlTextures/girlTexture6", ext: ".plist", type: SpriteAtlas, uuid: "10a17238-4017-4a5d-acaf-2cf8f2201da4" },
		girlTextures_girlTexture6_png: { bundle: "atlas", url: "girlTextures/girlTexture6", ext: ".png", type: SpriteFrame, uuid: "d06e596f-c7eb-4ac2-b61b-7db8f6796c85" },
		girlTextures_girlTexture7_plist: { bundle: "atlas", url: "girlTextures/girlTexture7", ext: ".plist", type: SpriteAtlas, uuid: "67a74e79-ef94-4e80-bd3e-f100eaac280a" },
		girlTextures_girlTexture7_png: { bundle: "atlas", url: "girlTextures/girlTexture7", ext: ".png", type: SpriteFrame, uuid: "be8e3d87-ac24-4b59-b8d9-473e9da7c01c" },
		girlTextures_girlTexture8_plist: { bundle: "atlas", url: "girlTextures/girlTexture8", ext: ".plist", type: SpriteAtlas, uuid: "7c660370-1462-44e8-bfb5-7de952cb7bd8" },
		girlTextures_girlTexture8_png: { bundle: "atlas", url: "girlTextures/girlTexture8", ext: ".png", type: SpriteFrame, uuid: "a552cded-1115-4a41-8bff-db13193e6e13" }
	},
	image: {
		big_daofengyizhi_png: { bundle: "image", url: "big_daofengyizhi", ext: ".png", type: SpriteFrame, uuid: "ef9a2b8b-daff-4479-b976-a33234861fa3" },
		big_huawang_png: { bundle: "image", url: "big_huawang", ext: ".png", type: SpriteFrame, uuid: "44c65b20-6702-4f0c-b674-01fe3112454b" },
		big_qinsexiannv_png: { bundle: "image", url: "big_qinsexiannv", ext: ".png", type: SpriteFrame, uuid: "61ae7673-8c17-413a-8b9f-0bd12cbbac2f" },
		big_shengguangjisi_png: { bundle: "image", url: "big_shengguangjisi", ext: ".png", type: SpriteFrame, uuid: "77bbda0d-be76-4412-9b70-21c31d245527" },
		big_shuguangnvshen_png: { bundle: "image", url: "big_shuguangnvshen", ext: ".png", type: SpriteFrame, uuid: "9bb7d5c5-b071-45b5-a728-126e4ae9c281" },
		big_zhanzhengzhinv_png: { bundle: "image", url: "big_zhanzhengzhinv", ext: ".png", type: SpriteFrame, uuid: "3c0c9776-e49e-462e-9508-a022e51d5267" },
		zxnn_main_atlas_plist: { bundle: "image", url: "zxnn_main_atlas", ext: ".plist", type: SpriteAtlas, uuid: "ec6af875-be27-41a4-92be-06042e848fde" },
		zxnn_main_atlas_png: { bundle: "image", url: "zxnn_main_atlas", ext: ".png", type: SpriteFrame, uuid: "e80e626f-66d8-47ed-afd6-a74a52d53b22" }
	},
	dragon: {
		bawanglong_ske_json: { bundle: "dragon", url: "bawanglong_ske", ext: ".json", type: dragonBones.DragonBonesAsset, uuid: "6349c8e4-3b1d-4289-8e1b-a34380e15e98" },
		bawanglong_tex_json: { bundle: "dragon", url: "bawanglong_tex", ext: ".json", type: dragonBones.DragonBonesAtlasAsset, uuid: "b047be6f-e1f8-4dd8-b09f-7ca6d455c643" },
		bawanglong_tex_png: { bundle: "dragon", url: "bawanglong_tex", ext: ".png", type: SpriteFrame, uuid: "e518b498-27c8-4648-b166-55c24c73ba25" }
	},
	spine: {
		chuansongganzi_atlas_txt: { bundle: "spine", url: "chuansongganzi.atlas", ext: ".txt", type: TextAsset, uuid: "acff6db5-f5d6-48fa-a9ed-1c49a467b2b4" },
		chuansongganzi_json: { bundle: "spine", url: "chuansongganzi", ext: ".json", type: sp.SkeletonData, uuid: "764b3ff7-4795-42a0-858d-6b788010152b" },
		chuansongganzi_png: { bundle: "spine", url: "chuansongganzi", ext: ".png", type: SpriteFrame, uuid: "a63ccdec-b228-4bec-b261-4bcc1f8eb5e7" }
	},
	prefab: {
		prefab_png_prefab: { bundle: "prefab", url: "prefab_png", ext: ".prefab", type: Prefab, uuid: "5da5310c-5f5c-456a-ba61-755d68fbc7ee" }
	}
}

globalThis["usingAssets"] = usingAssets;


export const usingBundles = {
	atlas: "atlas",
	image: "image",
	dragon: "dragon",
	spine: "spine",
	prefab: "prefab"
}
globalThis["usingBundles"] = usingBundles;