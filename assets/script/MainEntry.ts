import { _decorator, Component, Node, assetManager, Sprite, SpriteFrame, Button, NodeEventType, Texture2D, AudioClip, AudioSource, Asset } from 'cc';
import { DEBUG } from 'cc/env';
import { usingAssets } from './config/usingAssets';



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

        window["f1"].asyncSpriteFrame = "https://baishancdn.hicnhm.com/beiji_res/assets/avatar3/300000010_1_1.png";
        console.log("xxxxxxx", window["f1"].asyncSpriteFrame);//异步进行中,获得的是 https://baishancdn.hicnhm.com/beiji_res/assets/avatar3/300000010_1_1.png
        setTimeout(() => { 
            console.log("yyyyyyyy", window["f1"].asyncSpriteFrame);//异步完成后 获得的是 SpriteFrame实例
        },2000)
    }

    start() {
        
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

    }

    update(deltaTime: number) {

    }
}

