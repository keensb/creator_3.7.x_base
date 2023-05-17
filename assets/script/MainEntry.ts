import { _decorator, Component, Node, assetManager, Sprite, SpriteFrame, Button, NodeEventType, Texture2D, AudioClip, AudioSource, Asset, SpriteAtlas, find } from 'cc';
import { DEBUG } from 'cc/env';
import { ClassDictionary } from './ClassDictionary';
import { usingAssets } from './config/usingAssets';
import { AnimationLite } from './customComponent/AnimationLite';

import { asyncAsset } from './mgr/asyncAsset';

const { ccclass, property } = _decorator;

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


    onLoad() {
        this.btn1.node.on(NodeEventType.TOUCH_END, this.loadingAsset, this);
        this.btn2.node.on(NodeEventType.TOUCH_END, this.unUseAsset, this);
        this.btn3.node.on(NodeEventType.TOUCH_END, this.useAsset, this);
        this.btn4.node.on(NodeEventType.TOUCH_END, this.destroyAsset, this);

        

        window["uid"] = this.sfUUID;
        window["f1"] = this.faceSp;
        window["f2"] = this.faceSp2;

        window["f1"].asyncSpriteFrame = 'http://172.16.70.38:5050/public/title.jpg';//"https://baishancdn.hicnhm.com/beiji_res/assets/avatar3/300000010_1_1.png";


        window["ClassDictionary"] = ClassDictionary;

    }

    async start() {
        //for(let x in usingAssets.atlas.girlTexture0_plist)

        let listObj: { [key: string]: SpriteAtlas } = {};
        let count = 0;
        for (let i = 0; i < 9; i++) {
            assetManager.loadAny(usingAssets.atlas["girlTexture" + i + "_plist"].uuid, null, (err, res: SpriteAtlas) => {
                listObj[i] = res;
                console.log("iiiiiiiiiiiii", i, listObj[i]);
              
                if (Object.keys(listObj).length == 9) {
                    let sfArr: SpriteFrame[] = [];
                    for (let j = 0; j < 9; j++) {
                        console.log("jjjjjjjjjjjjj", j, listObj[j]);
                        for (let key in listObj[j].spriteFrames) {
                            sfArr.push(listObj[j].spriteFrames[key]);
                        }
                    }

                    let anim: any = new AnimationLite(sfArr, 30);
                    window["anim"] = anim;
                    anim.parent = find("Canvas");
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