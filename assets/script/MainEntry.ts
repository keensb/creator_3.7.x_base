import { _decorator, Component, Node, assetManager, Sprite, Button, NodeEventType, Texture2D, AudioClip, AudioSource, Asset, SpriteAtlas, find, SpriteFrame, ImageAsset, CCString, CCInteger, TweenAction, Tween, tween, director, EventTouch, Graphics, Color, BlockInputEvents, UITransform } from 'cc';
import { DEBUG } from 'cc/env';
import { ClassDictionary } from './ClassDictionary';
import { usingAssets } from './config/usingAssets';
import { AnimationLite } from './develop/customNode/AnimationLite';

import { asyncAsset } from './develop/mgr/asyncAsset';
import { AnimationGroup, TextureInfoMaker, getSpriteWithAnimationGroup } from './develop/anim/AnimationGroup';
import { EngineOverrider } from './develop/overwrite/EngineOverrider';
import { alignMgr } from './develop/ccutils/alignMgr';

const { ccclass, property } = _decorator;

@ccclass('MainEntryObject')
class MainEntryObject {
    @property(CCString)
    str1: string = "";

    @property(CCInteger)
    str2: number = 0;
}

@ccclass('MainEntry')
export class MainEntry extends Component {
    @property(Sprite)
    faceSp: Sprite = null;

    @property(Sprite)
    faceSp2: Sprite = null;

    @property(Button)
    btn1: Button = null;

    @property(Button)
    btn2: Button = null;

    @property(Button)
    btn3: Button = null;

    @property(Button)
    btn4: Button = null;

    @property([MainEntryObject])
    objArr: MainEntryObject[] = [];

    onLoad() {
        /* this.node.on(NodeEventType.TOUCH_START, (evt: EventTouch) => {
            evt.propagationImmediateStopped = true;
            console.log(evt);
            console.log("xx", alignMgr.getGlobalLeft(this.btn1.node), alignMgr.getGlobalBottom(this.btn1.node));
        }, this) */

        this.btn1.node.on(NodeEventType.TOUCH_END, this.loadingAsset, this);
        this.btn2.node.on(NodeEventType.TOUCH_END, this.unUseAsset, this);
        this.btn3.node.on(NodeEventType.TOUCH_END, this.useAsset, this);
        this.btn4.node.on(NodeEventType.TOUCH_END, this.destroyAsset, this);

  
        window["btn1"] = this.btn1.node;
        window["btn2"] = this.btn2.node;
        window["btn3"] = this.btn3.node;
        

        window["uid"] = this.sfUUID;
        window["f1"] = this.faceSp;
        window["f2"] = this.faceSp2;

        window["f1"].asyncSpriteFrame = "https://baishancdn.hicnhm.com/beiji_res/assets/avatar3/300000010_1_1.png";


        window["ClassDictionary"] = ClassDictionary;

        /* let gNode = new Node();
        gNode.parent = director.getScene();
        var graphics = gNode.directGetComponent(Graphics);
        graphics.circle(0, 0, 100);
        let color = new Color(0,255,0,60);
        graphics.fillColor = color;
      
        graphics.fill();
        
        
        gNode.parent = this.node;

        graphics.lineWidth = 3;
        graphics.strokeColor = new Color(0, 0, 255);
        graphics.moveTo(-40, 0);
        graphics.lineTo(0, -80);
        graphics.lineTo(40, 0);
        graphics.lineTo(0, 80);

        graphics.stroke(); */
        
        //this.node.uiTransform.convertToWorldSpaceAR(cc.vec2(0, 0))

        this.node.rotation
        this.node.getComponent(UITransform)
    }

    async start() {

        if (this.isLoading) return;
        //http://172.16.70.32:5050/public
        //asyncAsset.bundleLoadOneAsset(
        //for(let x in usingAssets.atlas.girlTexture0_plist)
        let listObj: { [key: string]: any } = {};
        /*
         for (let i = 0; i < 9; i++) {
            asyncAsset.bundleLoadOneAsset("atlas", usingAssets.atlas["girlTextures_girlTexture" + i + "_plist"].url, SpriteAtlas, (res: SpriteAtlas) => {
                listObj[i] = res;
                if (Object.keys(listObj).length == 9) {
                    let sfArr: SpriteFrame[] = [];
                    for (let j = 0; j < 9; j++) {
                        for (let key in listObj[j].spriteFrames) {
                            sfArr.push(listObj[j].spriteFrames[key]);
                        }
                    }

                    let anim: Node = new AnimationLite(sfArr, 30);
                    window["anim"] = anim;
                    anim.parent = find("Canvas");
                }
            });
        } 
        */
        //远程加载 SpriteAtlas, 只能通过 Asset Bundle, 不能直接通过资源的uuid
        assetManager.loadBundle("atlas", () => {//1 先加载 bundle
            for (let i = 0; i < 9; i++) {
                assetManager.getBundle("atlas").load(usingAssets.atlas["girlTextures_girlTexture" + i + "_plist"].url, SpriteAtlas, (err, res) => {//2 第二个参数 SpriteAtlas 是必须的, 否则加载资源会被解析成 ImageAsset
                    listObj[i] = res;
                    if (Object.keys(listObj).length == 9) {
                        let sfArr: SpriteFrame[] = [];
                        for (let j = 0; j < 9; j++) {
                            for (let key in listObj[j].spriteFrames) {
                                sfArr.push(listObj[j].spriteFrames[key]);
                            }
                        }

                        let anim: Node = new AnimationLite(sfArr, 30);
                        window["anim"] = anim;
                        anim.parent = find("Canvas");
                    }
                })
            }
        })


        let count2 = 0;
        for (let i = 1; i <= 74; i++) {
            //http://172.16.70.32:5050/public/gif/role/role0001.png
            /* let preName = "http://172.16.70.32:5050/public/gif/role/role";
            let info0 = TextureInfoMaker.createInfoStart2End(preName, ".png", 1, 18, 4, "scene");//登场
            let info1 = TextureInfoMaker.createInfoStart2End(preName, ".png", 19, 26, 4, "idle");//待机
            let info2 = TextureInfoMaker.createInfoStart2End(preName, ".png", 27, 46, 4, "walk");//走路
            let info3 = TextureInfoMaker.createInfoStart2End(preName, ".png", 47, 58, 4, "attack", { cx: 48, cy: 2, cs: 2 });//攻击 
            let info4 = TextureInfoMaker.createInfoStart2End(preName, ".png", 59, 74, 4, "dash");//冲刺
            let info5 = TextureInfoMaker.createInfoStart2End(preName, ".png", 97, 128, 4, "critical");//暴击
            let info6 = TextureInfoMaker.createInfoStart2End(preName, ".png", 315, 330, 4, "run");//跑步
            let info7 = TextureInfoMaker.createInfoStart2End(preName, ".png", 331, 382, 4, "skill");//技能
            let info8 = TextureInfoMaker.createInfoStart2End(preName, ".png", 279, 282, 4, "hitted", { cs: 1.6 });//被攻击 */

            let f = i.toString();
            while (f.length < 4) {
                f = 0 + f;
            }
            //console.log("http://172.16.70.32:5050/public/gif/role/role" + f + ".png");
            asyncAsset.loadOneRemoteSpriteFrame("http://172.16.70.32:5050/public/gif/role/role" + f + ".png", (data) => {
                if (data) {
                    count2++;
                   /*  let imageAsset = data as ImageAsset;
                    let spriteFrame = new SpriteFrame();
                    let texture = new Texture2D();
                    texture.image = imageAsset;
                    spriteFrame.texture = texture;
                    spriteFrame["$_$__remoteURL__"] = data["$_$__remoteURL__"];
                    spriteFrame._uuid = spriteFrame["$_$__remoteURL__"];
                    asyncAsset.remoteSpriteFrameCache[data["$_$__remoteURL__"]] = spriteFrame; */
                }
                if (count2 == 74) {
                    let preName = "http://172.16.70.32:5050/public/gif/role/role";
                    let info0 = TextureInfoMaker.createInfoStart2End(preName, ".png", 1, 18, 4, "scene");//登场
                    let info1 = TextureInfoMaker.createInfoStart2End(preName, ".png", 19, 26, 4, "idle");//待机
                    let info2 = TextureInfoMaker.createInfoStart2End(preName, ".png", 27, 46, 4, "walk");//走路
                    let info3 = TextureInfoMaker.createInfoStart2End(preName, ".png", 47, 58, 4, "attack", { cx: 48, cy: 2, cs: 2 });//攻击 
                    let info4 = TextureInfoMaker.createInfoStart2End(preName, ".png", 59, 74, 4, "dash");//冲刺
                    let info5 = TextureInfoMaker.createInfoStart2End(preName, ".png", 97, 128, 4, "critical");//暴击
                    let info6 = TextureInfoMaker.createInfoStart2End(preName, ".png", 315, 330, 4, "run");//跑步
                    let info7 = TextureInfoMaker.createInfoStart2End(preName, ".png", 331, 382, 4, "skill");//技能
                    let info8 = TextureInfoMaker.createInfoStart2End(preName, ".png", 279, 282, 4, "hitted", { cs: 1.6 });//被攻击 */
                    //let ani = getSpriteWithAnimationGroup([info0], 1, true, asyncAsset.remoteSpriteFrameCache);
                    let ani = new AnimationGroup(find("Canvas/sprite"), [info0, info1, info2, info3, info4], 1, true, asyncAsset.remoteSpriteFrameCache)

                    window["oo"] = find("Canvas/big_huawang");
                    window["vv"] = ani;
                    ani.gotoAndPlayInPart(2);
                }
            })

            //let ani = getSpriteWithAnimationGroup([info0, info1, info2, info3, info4, info5, info6, info7, info8], 1, true, textureSource);
            // this.node.addChild(ani.display);
        }

        let roleArr = new Array(456);
        let count = 0;
        for (let i = 1; i <= roleArr.length; i++) {
            let n;
            if (i < 10) {
                n = "000" + i;
            }
            else if (i < 100) {
                n = "00" + i;
            }
            else if (i < 1000) {
                n = "0" + i;
            }

            asyncAsset.loadOneRemote(`http://172.16.70.32:5050/public/gif/role/role${n}.png`).then((res: ImageAsset) => {
                count++;
                let texture = new Texture2D();
                texture.image = res;
                //console.log("res.url =",res.url);
                let spriteFrame = new SpriteFrame();
                spriteFrame.texture = texture;
                roleArr[i - 1] = spriteFrame;
                //console.log("count=", count, res);
                if (count == roleArr.length) {
                    let anim2: Node = new AnimationLite(roleArr, 30);
                    window["anim2"] = anim2;
                    anim2.parent = find("Canvas");
                    anim2.x += 150;
                }
            });
        }
    }

    private isLoading: boolean = false;
    private sfUUID = "ef9a2b8b-daff-4479-b976-a33234861fa3@f9941"

    private currentSF: SpriteFrame;
    private async loadingAsset() {
        if (this.isLoading) return;
        //this.isLoading = true;
        /*  assetManager.loadAny(this.sfUUID, SpriteFrame, (err, res) => {
             this.isLoading = false;
             if (!err && res) {
                 
                 this.faceSp.spriteFrame = res;
                 this.faceSp2.spriteFrame = res;
                 this.currentSF = this.faceSp.spriteFrame;
                 window["currentSF"] = this.currentSF;
                 //this.currentSF.addRef();
             }
         }) */

        //let bundle = await asyncAsset.loadOneBundle("pic");
        /* console.log(assetManager.getBundle("pic"), bundle)
        assetManager.removeBundle(bundle);
        console.log(assetManager.getBundle("pic"), bundle) */

        let res = await asyncAsset.loadAny("ef9a2b8b-daff-4479-b976-a33234861fa3@f9941", SpriteFrame);
        this.faceSp.spriteFrame = res;
        this.faceSp2.spriteFrame = res
        this.currentSF = res;
        window["currentSF"] = this.currentSF;
        this.isLoading = false;
        //////////////////////////
        /* let imageAsset = await asyncAsset.loadOneRemote("https://baishancdn.hicnhm.com/beiji_res/assets/avatar3/300000010_1_1.png");
        let res = new SpriteFrame();
        let texture:any = new Texture2D();
        texture.image = imageAsset;
        res.texture = texture;
        this.faceSp.spriteFrame = res;
        this.faceSp2.spriteFrame = res
        window["currentSF"] = this.currentSF; 
        this.isLoading = false;*/
        //////////////////////////
        //assetManager.loadAny("ef9a2b8b-daff-4479-b976-a33234861fa3@f9941", null, null, (err, res) => {
        /* assetManager.loadAny("ef9a2b8b-daff-4479-b976-a33234861fa3@f9941", (err, res: Asset) => {
             this.faceSp.spriteFrame = res as SpriteFrame;
             this.faceSp2.spriteFrame = res as SpriteFrame;
             this.currentSF = res as SpriteFrame;
             this.isLoading = false;
             window["currentSF"] = this.currentSF;
         })  */



        //////////////////////////
        /* let res = await asyncAsset.bundleLoadOneAsset("pic", usingAssets.pic.big_daofengyizhi_png.url, SpriteFrame);
        this.faceSp.spriteFrame = res;
        this.faceSp2.spriteFrame = res
        window["currentSF"] = this.currentSF; 
        this.isLoading = false;*/
        //////////////////////////


    }

    private unUseAsset(): void {
        this.faceSp.spriteFrame = null;
        usingAssets.atlas.girlTextures_girlTexture0_plist.url
        //this.currentSF.decRef();
        //assetManager.releaseAsset(this.currentSF);
    }

    private useAsset(): void {
        this.faceSp.spriteFrame = this.currentSF;
        this.faceSp2.spriteFrame = this.currentSF;
    }

    private destroyAsset(): void {

        if (this.faceSp.spriteFrame && this.faceSp.spriteFrame.isValid) {
            this.faceSp.spriteFrame.forceDestroy();
        }

        if (this.faceSp2.spriteFrame && this.faceSp2.spriteFrame.isValid) {
            this.faceSp2.spriteFrame.forceDestroy();
        }
        if (this.currentSF && this.currentSF.isValid) {
            this.currentSF.forceDestroy();
        }

        usingAssets.atlas['/girlTextures/girlTexture0.png']
    }

    update(deltaTime: number) {
        let a = ClassDictionary.getClassByTarget(1);
    }
}



window["MainEntry"] = MainEntry;