import { EventTarget, Scene, Node, SpriteFrame, director, math, Sprite, assetManager, find } from "cc";
/**
 * Created by YeXin on 2015/12/12.
 */

import { GameEvent } from "../types/GameEvent";
import { disTypes } from "../types/disType";
import { AbstractAnimation } from "./AbstractAnimation";
import { EngineOverrider } from "../overwrite/EngineOverrider";
import { asyncAsset } from "../mgr/asyncAsset";
import { DEBUG } from "cc/env";

/**自动新建一个Node, 作为新建的AnimationGroup的呈现器*/
export function getSpriteWithAnimationGroup(textureInfoList: Array<TextureInfo> = null, startFrame: number = 1, autoPlayOnInit: boolean = true, textureSource: any = null): AnimationGroup {
    let sprite = new Node();
    sprite.addComponent(Sprite);
    let animationGroup = new AnimationGroup(sprite, textureInfoList, startFrame, autoPlayOnInit, textureSource);
    return animationGroup;
}


/**
 * 从多个不同名称的纹理集创建多个动画片段, 并将这些动画片段首尾相接组合成自定义的影片剪辑；每个片段都有自己独立的片段头和片段尾标识；片段都有各自的播放速度因子; 可设置连贯播放或定点循环播放；可更改Bitmap对象显示各组纹理集时的对齐方式和修正偏移; 
 * (注意:纹理集在配置文件default.res.json中声明的type必须是"sheet", url后缀必须是 ".json" 如果不能正常输出动画又没有报错提示、浏览器在打开时崩溃, 请优先检查此两项)
 */
export class AnimationGroup extends AbstractAnimation implements IAnimation {
    protected $currentTextureName: string;//当前纹理名称

    protected flagObject: any;

    private startFrame: number;//初始帧序号
    private autoPlayOnInit: boolean;//初始是否自动播放
    private textureInfoList: Array<TextureInfo>;
    private $partArray: Array<Array<number>>;
    private correctedPointArray: Array<math.Vec2>;
    private correctedSpeedArray: Array<number>;
    private $textureNameList: Array<string>;
    private $partHeadNumList: Array<number>;//片段头帧序号列表
    private $partTailNumList: Array<number>;//片段尾帧序号列表
    private start: number;//Texture信息后缀的当前值, 在min与max间浮动;每一帧都可视为一个起点
    private partIndexDic: { [flag: string]: number } = {};
    private partFlagDic: { [index: number]: string } = {};

    private cs: number = 1; //当前part的frame时间因子 构建成frameScale的一环


    public textureSource: { [key: string]: SpriteFrame };//纹理集数据源集合

    private thisPlayHandler: Function;
    /*
    加载远程纹理集示例  加载目标纹理集绑定的 json 文件,  加载成功后可获得 Laya.AtlasResource 实例
    Laya.loader.load(url, Laya.Loader.ATLAS).then(
        (res) => {
            let textureSource = <Laya.AtlasResource>res;

            let mc = new AnimationGroup();//创建一个 AnimationGroup 实例
            mc.textureSource = textureSource;//绑定纹理数据源 方法1

            let sourceObj: any = {};
            for (let key in textureSource._textureMap)
            {
                sourceObj[key] = textureSource.getTexture(key);
            }
            mc.textureSource = sourceObj;//绑定纹理数据源 方法2
        });
    */

    private $isNatureEnter: boolean = false;//当前进入片段头的时间轴, 是否属于自然(即非跳帧)进入, 用于判断是否执行了跳帧语句




    /* 
        创建一个 AnimationGroup 实例对象的例子

        //第1段动画
        let preName1 = "anim_";//纹理名称前缀
        let totalFrames1 = 10;
        let minIndex1 = 1;
        let digits1 = 2;
        let partFlag1 = "run";
        let info1 = TextureInfoMaker.createInfo(preName1, totalFrames1, minIndex1, digits1 , partFlag1);

        //或者 以开始帧和结束帧作为参数的创建
        let info1 = createInfoStart2End(preName1, 1, 10, digits1 , partFlag1);

        //第2段动画
        let preName2 = "hello_";//纹理名称前缀
        let sufName2 = "_png";//纹理名称后缀 可不加
        let totalFrames2 = 10;
        let minIndex2 = 0;
        let digits2 = 1;
        let partFlag2 = "attack";
        let info2 = TextureInfoMaker.createInfo(preName2, sufName2, totalFrames2, minIndex2, digits2, partFlag2);//带后缀
 
       
        this.addChild(anim); 

        构建顺序  
        //没有自定义的sourceObj时
        let anim = new AnimationGroup([info1, info2], 1);
        this.addChild(anim); 

        //有自定义的sourceObj时
        let anim = new AnimationGroup();
        anim.overideTextureSource(this.sourceObj);//先传入sourceObj, 再构建动画数据  否则会弹出警告 "AnimationGroup 无法获取有效的 Texture: xxxxxx"
        anim.reconstruct([info0, info1, info2, info3], 1);

        使用 AnimationGroup 实例对象的关键API 
        //例如循环播放奔跑动作 
        let runPartindex = this.getPlayPartIndexByFlag("run"); //找到 "run"动作片段所属的 partIndex
        this.gotoAndPlayInPart(runPartindex)
    */

    /**
     * @param animBG    本动画的呈现器, 一般是一个Node
     * @param textureInfoList 纹理信息对象列表, 包含了纹理的名称与播放时的坐标修正值 ※可以通过TextureInfoMaker类的静态方法createInfo生成TextureInfo对象
     * @param startFrame 初始序号变量, 决定影片剪辑在初始化时的时间轴停留在那一帧上。建议是不小于1的整数
     * @param autoPlayOnInit  是否在构建和初始化完毕后就开始自动播放
     * @param textureSource 纹理集数据源
     * 
     */
    public constructor(node: any, textureInfoList: Array<TextureInfo> = null, startFrame: number = 1, autoPlayOnInit: boolean = true, textureSource: any = null) {
        super(node);
        this.animBG = node;
        this.animBG.directGetComponent(Sprite);
        this.textureSource = textureSource;
        this.thisPlayHandler = this.playHandler.bind(this);
        if (textureInfoList) {
            this.reconstruct(textureInfoList, startFrame, autoPlayOnInit);
        }
    }


    private $textureInfoList: Array<TextureInfo>;
    /**
     * 重构影片剪辑信息(异步加载远程资源时可能需要用到这个), 并可替换纹理集资源指针
     * @param textureInfoList 纹理信息对象列表, 包含了纹理的名称与播放时的坐标修正值
     * @param startFrame 初始序号变量, 决定影片剪辑在初始化时的时间轴停留在那一帧上。建议是不小于1的整数
     * @param autoPlayOnInit  是否在构建和初始化完毕后就开始自动播放
     * 
     */
    public reconstruct(textureInfoList: Array<TextureInfo> = null, startFrame: number = 1, autoPlayOnInit: boolean = true): void {
        if (!textureInfoList) {
            textureInfoList = this.$textureInfoList;
        }
        if (!textureInfoList || textureInfoList.length < 1) {
            throw new Error("textureInfoList不能为空, 并且长度不能小于1");
            //return;
        }

        this.$textureInfoList = textureInfoList;
        this.$totalFrames = 0;
        this.$partArray = new Array<Array<number>>();
        this.$partHeadNumList = new Array<number>();
        this.$partTailNumList = new Array<number>();
        this.correctedPointArray = new Array<math.Vec2>();
        this.correctedSpeedArray = new Array<number>();
        this.$textureNameList = new Array<string>();
        for (let i: number = 0; i < textureInfoList.length; i++) {
            let part: Array<number> = [this.$totalFrames + 1];
            this.$totalFrames += textureInfoList[i].nameArray.length;
            part.push(this.$totalFrames);
            this.$partArray.push(part);
            this.$partHeadNumList.push(part[0] - 1);
            this.$partTailNumList.push(part[1] - 1);
            if (textureInfoList[i].flag) {
                if (this.partIndexDic[textureInfoList[i].flag]) {
                    console.warn("构建AnimationGroup的TextureInfo出现flag 重复 ", textureInfoList[i].flag)
                }
                this.partIndexDic[textureInfoList[i].flag] = i;
                this.partFlagDic[i] = textureInfoList[i].flag;
            }
            else {
                this.partFlagDic[i] = "";
            }

            this.correctedPointArray.push(textureInfoList[i].correctedPoint);
            this.correctedSpeedArray.push(textureInfoList[i].cs);
            this.$textureNameList = this.$textureNameList.concat(textureInfoList[i].nameArray);
        }

        if (startFrame < 1 || startFrame > this.$totalFrames) {
            throw new Error("初始帧start数值不在有效范围内  " + startFrame + "  " + this.$totalFrames);
            //return;
        }



        this.$isPlaying = false;

        this.animBG.getComponent(Sprite).unschedule(this.thisPlayHandler);
        this.clearLoopPoint();
        this.textureInfoList = textureInfoList;
        this.start = Math.floor(startFrame);
        this.startFrame = startFrame;
        this.autoPlayOnInit = autoPlayOnInit;

        this.$currentFrame = this.start;



        let texture: SpriteFrame = this.checkAndCreateTexture(this.$textureNameList[startFrame - 1]);
        this.animBG.getComponent(Sprite).spriteFrame = texture;

        this.setDriver();

        if (autoPlayOnInit) {
            this.play();
        }

        if (!this.callBackFunctionCollection) {
            this.callBackFunctionCollection = new Array<Function>();
        }
        this.callBackFunctionCollection.length = 0;
        this.flagObject = {};

        this.emit(GameEvent.ANIM_RECONSTRUCTED);
    }


    public overideTextureSource(textureSource: { [key: string]: SpriteFrame }): { [key: string]: SpriteFrame } {
        if (!this.textureSource) this.textureSource = {};

        for (let oldKey in this.textureSource) {
            delete this.textureSource[oldKey];
        }

        for (let key in textureSource) {
            this.textureSource[key] = textureSource[key];
        }

        return this.textureSource;
    }

    /**
     * 复制并返回一个AnimationGroup副本，其构造函数的内容与原对象一致
     * 
     */
    public clone(): AnimationGroup {
        let animBG = new Node();
        let newObj = new AnimationGroup(animBG, this.textureInfoList, this.startFrame, this.autoPlayOnInit, this.textureSource);
        newObj.textureSource = this.textureSource;
        return newObj;
    }

    private static checkNameArray: Array<string>;
    private checkAndCreateTexture(textureName: string): SpriteFrame {
        if (!AnimationGroup.checkNameArray) {
            AnimationGroup.checkNameArray = [];
        }
        let texture: SpriteFrame;

        let t1 = null;
        let t2;
        if (this.textureSource) {
            t2 = this.textureSource[textureName];
        }
        texture = t2 || t1;//优先使用数据源对象的纹理
        if (this.$currentTextureName != textureName) {
            this.$currentTextureName = textureName;
            if (!textureName || textureName == "(╯‵□′)╯︵┻━┻(T﹏T)") {
                //console.warn("空白帧");
            }
            else if (!texture && AnimationGroup.checkNameArray.indexOf(textureName) == -1) {
                AnimationGroup.checkNameArray.push(textureName);
                // throw new Error("无法获取有效的 Texture");
                // return;
                if (DEBUG && this.textureSource && !this.textureSource[textureName]) {
                    console.warn("AnimationGroup 无法获取有效的 Texture: " + textureName + "，请检查名称拼写，或确认是否已经正常加载该资源");
                }
                /*
                 //console.warn("<新建纹理集资源时常见问题：>");
                 //console.warn("1、配置文件中 resources组 的 name 是否存在于 groups组 的某个 keys 序列中, 拼写是否正确");
                 //console.warn("2、配置文件中 resources组 的 name 所在的 groups组 是否已经被成功加载, 这需要检查加载流程");
                 //console.warn("3、配置文件中 resources组 的 type 是否为 sheet");
                 //console.warn("4、配置文件中 resources组 的纹理集描述资源的 url 路径是否正确, 后缀是否为 .json");
                 //console.warn("5、纹理集描述资源中 frames 对象是否包含了 " + textureName +", 可直接复制该名称到纹理集描述资源中查找");
                 //console.warn("<修改原纹理集资源后常见问题：>");
                 //console.warn("6、纹理集描述资源中 file 所指定的纹理集图片是否存在, 拼写是否有误, 特别要注意后缀名是 .png 还是 .jpg");
                 */

                //(注意:纹理集在配置文件default.res.json中声明的type必须是"sheet", url后缀必须是 ".json" 如果不能正常输出动画又没有报错提示、浏览器在打开时崩溃, 请优先检查此两项)
            }
            return texture;
        }
        else {
            this.$currentTextureName = textureName;
            return texture;
        }
    }

    /**
     * 添加帧回调事件, 相当于把代码写在帧上, 当时间轴播放到该帧时将会自动触发回调。※注意因为ENTER_FRAME事件需要延迟1帧才会开始生效, 所以添加在当前时间轴所在的帧下标的回调, 往往会被错开, 直到下次时间轴经过时才会真正执行。如果需要即时生效, 可以把参数withImmediateEffect设为true
     * @param frameIndex 目标帧数的下标, 建议是正整数, ※注意是下标(根据Flash习惯, 第1帧的下标是0, 第2帧的下标是1, 以此类推)
     * @param callFunction  回调函数, 注意绑定this指针
     * @param thisObj   回调函数的绑定对象
     * @param withImmediateEffect   如果添加回调事件的帧恰好是当前时间轴所在帧时, 是否立即生效
     * 
     */
    public addFrameScript(frameIndex: number, callFunction: Function, thisObj: any = this, withImmediateEffect: boolean = true): void {
        let f: number = Math.floor(frameIndex);
        if (isNaN(f) || f < 0 || f > this.$totalFrames - 1) {
            throw new Error("事件帧序号数值不在有效范围内");
            //return;
        }

        this.callBackFunctionCollection[f] = () => { callFunction.call(thisObj) };

        if (withImmediateEffect) {
            if (f == this.start && this.executeFrameScript) {
                this.callBackFunctionCollection[f].call(null);
            }
        }
    }

    /**
     * 添加执行一次后就会自动清除的帧回调事件, 相当于把代码写在帧上, 当时间轴播放到该帧时将会自动触发回调。※注意因为ENTER_FRAME事件需要延迟1帧才会开始生效, 所以添加在当前时间轴所在的帧下标的回调, 往往会被错开, 直到下次时间轴经过时才会真正执行。如果需要即时生效, 可以把参数withImmediateEffect设为true
     * @param frameIndex 目标帧数的下标, 建议是正整数, ※注意是下标(根据Flash习惯, 第1帧的下标是0, 第2帧的下标是1, 以此类推)
     * @param callFunction  回调函数, 注意绑定this指针
     * @param thisObj   回调函数的绑定对象
     * @param withImmediateEffect   如果添加回调事件的帧恰好是当前时间轴所在帧时, 是否立即生效
     * 
     */
    public addFrameScriptOnce(frameIndex: number, callFunction: Function, thisObj: any = this, withImmediateEffect: boolean = true): void {
        let f: number = Math.floor(frameIndex);
        if (isNaN(f) || f < 0 || f > this.$totalFrames - 1) {
            throw new Error("事件帧序号数值不在有效范围内");
            //return;
        }

        this.callBackFunctionCollection[f] = () =>//复合函数
        {
            callFunction.call(thisObj);
            this.removeFrameScript(f);
        };

        if (withImmediateEffect) {
            if (f == this.start && this.executeFrameScript) {
                this.callBackFunctionCollection[f].call(null);
            }
        }
    }

    /**
     * 移除帧回调事件
     * @param frameIndex 目标帧数下标, ※注意是下标(根据Flash习惯, 第1帧的下标是0, 第2帧的下标是1, 以此类推)
     * 
     */
    public removeFrameScript(frameIndex: number): void {
        let f: number = Math.floor(frameIndex);
        if (isNaN(f) || f < 0 || f > this.$totalFrames - 1) {
            throw new Error("事件帧序号数值不在有效范围内");
            //return;
        }
        if (this.callBackFunctionCollection && this.callBackFunctionCollection[f]) {
            delete this.callBackFunctionCollection[f];
        }
    }


    /**
     * 添加帧回调事件, 相当于把代码写在帧上, 当时间轴播放到该帧时将会自动触发回调。※注意因为ENTER_FRAME事件需要延迟1帧才会开始生效, 所以添加在当前时间轴所在的帧下标的回调, 往往会被错开, 直到下次时间轴经过时才会真正执行。如果需要即时生效, 可以把参数withImmediateEffect设为true
     * @param partFlagOrIndex 目标片段的名称或下标
     * @param frameIndexInPart 相对于目标片段片头帧数的下标, 建议是正整数, ※注意是下标(根据Flash习惯, 第1帧的下标是0, 第2帧的下标是1, 以此类推)
     * @param callFunction  回调函数, 注意绑定this指针
     * @param thisObj   回调函数的绑定对象
     * @param withImmediateEffect   如果添加回调事件的帧恰好是当前时间轴所在帧时, 是否立即生效
     * 
     */
    public addFrameScriptInPart(partFlagOrIndex: string | number, frameIndexInPart: number, callFunction: Function, thisObj: any = this, withImmediateEffect: boolean = true): void {
        let frameIndex = typeof partFlagOrIndex == "string" ? this.getPartHeadAndTailByFlag(partFlagOrIndex).head + frameIndexInPart : this.getPartHeadAndTailAt(partFlagOrIndex).head + frameIndexInPart;
        let f: number = Math.floor(frameIndex);
        if (isNaN(f) || f < 0 || f > this.$totalFrames - 1) {
            throw new Error("事件帧序号数值不在有效范围内");
            //return;
        }

        this.callBackFunctionCollection[f] = () => { callFunction.call(thisObj) };

        if (withImmediateEffect) {
            if (f == this.start && this.executeFrameScript) {
                this.callBackFunctionCollection[f].call(null);
            }
        }
    }

    /**
     * 添加执行一次后就会自动清除的帧回调事件, 相当于把代码写在帧上, 当时间轴播放到该帧时将会自动触发回调。※注意因为ENTER_FRAME事件需要延迟1帧才会开始生效, 所以添加在当前时间轴所在的帧下标的回调, 往往会被错开, 直到下次时间轴经过时才会真正执行。如果需要即时生效, 可以把参数withImmediateEffect设为true
     * @param partFlagOrIndex 目标片段的名称或下标
     * @param frameIndexInPart 相对于目标片段片头帧数的下标, 建议是正整数, ※注意是下标(根据Flash习惯, 第1帧的下标是0, 第2帧的下标是1, 以此类推)
     * @param callFunction  回调函数, 注意绑定this指针
     * @param thisObj   回调函数的绑定对象
     * @param withImmediateEffect   如果添加回调事件的帧恰好是当前时间轴所在帧时, 是否立即生效
     * 
     */
    public addFrameScriptInPartOnce(partFlagOrIndex: string | number, frameIndexInPart: number, callFunction: Function, thisObj: any = this, withImmediateEffect: boolean = true): void {
        let frameIndex = typeof partFlagOrIndex == "string" ? this.getPartHeadAndTailByFlag(partFlagOrIndex).head + frameIndexInPart : this.getPartHeadAndTailAt(partFlagOrIndex).head + frameIndexInPart;
        let f: number = Math.floor(frameIndex);
        if (isNaN(f) || f < 0 || f > this.$totalFrames - 1) {
            throw new Error("事件帧序号数值不在有效范围内");
            //return;
        }

        this.callBackFunctionCollection[f] = () => {//复合函数

            callFunction.call(thisObj);
            this.removeFrameScript(f);
        };

        if (withImmediateEffect) {
            if (f == this.start && this.executeFrameScript) {
                this.callBackFunctionCollection[f].call(null);
            }
        }
    }

    /**
     * 移除帧回调事件
     * @param partFlagOrIndex 目标片段的名称或下标
     * @param frameIndexInPart 相对于目标片段片头帧数的下标, ※注意是下标(根据Flash习惯, 第1帧的下标是0, 第2帧的下标是1, 以此类推)
     * 
     */
    public removeFrameScriptInPart(partFlagOrIndex: string, frameIndexInPart: number): void {
        let frameIndex = typeof partFlagOrIndex == "string" ? this.getPartHeadAndTailByFlag(partFlagOrIndex).head + frameIndexInPart : this.getPartHeadAndTailAt(partFlagOrIndex).head + frameIndexInPart;
        let f: number = Math.floor(frameIndex);
        if (isNaN(f) || f < 0 || f > this.$totalFrames - 1) {
            throw new Error("事件帧序号数值不在有效范围内");
            //return;
        }
        if (this.callBackFunctionCollection && this.callBackFunctionCollection[f]) {
            delete this.callBackFunctionCollection[f];
        }
    }

    /**
     * 开始播放
     * 
     */
    public play(): void {
        if (this.$totalFrames == 1)//如果影片剪辑仅有1帧, 将忽略任何时间轴操作, 既不进入循环播放, 也不回调任何帧事件(Flash习惯)
        {
            this.stop();
            return;
        }
        this.$isPlaying = true;
        this.lastStepTime = Date.now();
        if (this.$driverType == disTypes.DriverType.FRAME) {
            this.animBG.getComponent(Sprite).unschedule(this.thisPlayHandler);
            this.animBG.getComponent(Sprite).schedule(this.thisPlayHandler, this.playInterval);
        }
        else if (this.$driverType == disTypes.DriverType.TIMER) {
            this.animBG.getComponent(Sprite).unschedule(this.thisPlayHandler);
            this.animBG.getComponent(Sprite).schedule(this.thisPlayHandler, this.playInterval);
        }
        this.onUpDate && this.onUpDate(this);
    }

    /**
     * 给指定的帧数设置一个flag  作为 gotoAndPlay(flag) 或 gotoAndStop(flag) 的标识
     * @param flag 标记
     * @param targetFrame 目标帧号
     * 
     */
    public setFlag(flag: string, targetFrame: number): void {
        targetFrame = Math.ceil(targetFrame);
        if (targetFrame > this.$totalFrames) {
            console.warn(`targetFrame(${targetFrame}) 大于 totalFrames(${this.$totalFrames}), 设置 flag 无效`);
            return;
        }
        if (!this.flagObject) {
            this.flagObject = {};
        }
        this.flagObject[flag] = targetFrame;
    }

    /**
     * 通过 flag  获取对应的帧号
     * @param flag 标记
     * 
     */
    public getFrameByFlag(flag: string): number {
        if (!flag) {
            return NaN;
        }
        if (!this.flagObject) {
            this.flagObject = {};
        }
        if (!this.flagObject[flag]) {
            console.warn("未指定的flag:", flag);
            return NaN;
        }
        return this.flagObject[flag];
    }

    /**
     * 将时间轴移到某一帧上并开始播放
     * @param value 目标帧号
     * 
     */
    public gotoAndPlay(value: number | string): void {
        if (this.$totalFrames == 1)//如果影片剪辑仅有1帧, 将忽略任何时间轴操作, 既不进入循环播放, 也不回调任何帧事件(Flash习惯)
        {
            this.stop();
            return;
        }
        let frame: number;
        if (typeof value == "number") {
            frame = value;
            if (isNaN(frame)) {
                console.error("帧标签 " + value + " 无效");
            }
        }
        else {
            frame = this.getFrameByFlag(value);
            if (isNaN(frame)) {
                console.error("帧标签 " + value + " 无效");
            }
        }

        this.$isNatureEnter = false;//非正常进入片段头
        let tempFrame: number = this.$currentFrame;
        this.$currentFrame = Math.floor(frame);
        if (this.$currentFrame < 1) {
            this.$currentFrame = 1;
        }
        else if (this.$currentFrame > this.$totalFrames) {
            this.$currentFrame = this.$totalFrames;
        }

        this.start = this.$currentFrame;
        let texture: SpriteFrame = this.checkAndCreateTexture(this.$textureNameList[this.start - 1]);
        this.animBG.getComponent(Sprite).spriteFrame = texture;



        if (this.callBackFunctionCollection && this.executeFrameScript && this.callBackFunctionCollection[this.$currentFrame - 1] && tempFrame != this.$currentFrame) {
            this.callBackFunctionCollection[this.$currentFrame - 1].call(null);//如果在gotoAndPlay的回调函数中执行停止的命令将会被忽略
        }

        this.play();

    }

    /**
     * 停止播放
     * 
     */
    public stop(): void {
        this.$isPlaying = false;
        this.animBG.getComponent(Sprite).unschedule(this.thisPlayHandler);
        this.start = this.$currentFrame;
        let texture: SpriteFrame = this.checkAndCreateTexture(this.$textureNameList[this.start - 1]);
        this.animBG.getComponent(Sprite).spriteFrame = texture;

        this.onUpDate && this.onUpDate(this);
    }

    /**
     * 将时间轴移到某一帧上并停止播放
     * @param value 目标帧号
     * 
     */
    public gotoAndStop(value: number | string): void {
        if (this.$totalFrames == 1)//如果影片剪辑仅有1帧, 将忽略任何时间轴操作, 既不进入循环播放, 也不回调任何帧事件(Flash习惯)
        {
            this.stop();
            return;
        }
        let frame: number;
        if (typeof value == "number") {
            frame = value;
            if (isNaN(frame)) {
                console.error("帧标签 " + value + " 无效");
            }
        }
        else {
            frame = this.getFrameByFlag(value);
            if (isNaN(frame)) {
                console.error("帧标签 " + value + " 无效");
            }
        }

        this.$isNatureEnter = false;//非正常进入片段头
        let tempFrame: number = this.$currentFrame;
        this.$currentFrame = Math.floor(frame);
        if (this.$currentFrame < 1) {
            this.$currentFrame = 1;
        }
        else if (this.$currentFrame > this.$totalFrames) {
            this.$currentFrame = this.$totalFrames;
        }

        this.stop();//如果gotoAndStop莫名失效, 往往是在下面的回调函数里又执行了播放语句
        if (this.callBackFunctionCollection && this.executeFrameScript && this.callBackFunctionCollection[this.$currentFrame - 1] && tempFrame != this.$currentFrame) {
            this.callBackFunctionCollection[this.$currentFrame - 1].call(null);
        }
    }

    protected playHandler(): void {
        if (!this.$isPlaying || !this.executeDriverType) {
            return;
        }
        if (this.$driverType == disTypes.DriverType.FRAME) {
            if (!this.$enforceStep) {
                this.currentInterval++;
            }
            else {
                let currentTime: number = Date.now();
                if (this.$staticStage == null) {
                    this.$staticStage = director.getScene();
                }
                let fps: number = 60 / 1000;
                this.currentInterval += (currentTime - this.lastStepTime) * fps;
                this.lastStepTime = currentTime;
            }
            while (this.currentInterval >= this.playInterval * 2) {
                this.currentInterval -= this.playInterval;
                this.autoNextFrame(false);//发生丢帧的时候不绘制可视内容
                if (!this.$isPlaying)//中途出现停止播放命令时终止循环
                {
                    return;
                }
            }
            if (this.currentInterval >= this.playInterval) {
                this.currentInterval -= this.playInterval;
                this.autoNextFrame(true);
            }
        }
        else if (this.$driverType == disTypes.DriverType.TIMER) {
            if (!this.$enforceStep) {
                this.autoNextFrame();
            }
            else {
                let currentTime: number = Date.now();
                while (currentTime >= this.lastStepTime + this.playInterval * 2) {
                    this.lastStepTime += this.playInterval;
                    this.autoNextFrame(false);//发生丢帧的时候不绘制可视内容
                    if (!this.$isPlaying)//中途出现停止播放命令时终止循环
                    {
                        return;
                    }
                }
                if (currentTime >= this.lastStepTime + this.playInterval) {
                    this.lastStepTime += this.playInterval;
                    this.autoNextFrame(true);
                }
            }
        }
    }

    public loopEnabled: boolean = true;

    protected autoNextFrame(isDraw: boolean = true): void {
        this.$isNatureEnter = true;
        if (this.start <= this.$totalFrames) {
            this.start++;
        }

        if (this.start > this.$totalFrames) {//播放头超出当前片段最大帧数时才算完成循环  如果 this.start == this.$totalFrames 就判定为循环完毕, 实质上少播了最后一帧

            if (this.isPlaying)//只有在isPlay等于true时才会循环播放(因此当时间轴停留在最后一帧时执行nextFrame无效, Flash习惯)
            {
                this.start = 1;
            }
            else {
                this.start = this.$totalFrames;
            }
        }

        if (this.executeLoop && this.isPlaying && this.$currentFrame == this.$loopEndFrame)//此时的this.$currentFrame还未赋值，仍等于上一次的this.start;用于判断是否已进入并否播完了第this.$loopEndFrame帧的内容
        {
            this.start = this.$loopStartFrame;
        }
        if (this.executeLoop && this.isPlaying && this.$currentFrame >= this.$loopStartFrame && this.$currentFrame <= this.$loopEndFrame && (this.driverType != this.$driverTypeOnLooping || this.$playIntervalOnLooping != this.playInterval)) {
            this.setDriver(this.$driverTypeOnLooping, this.$playIntervalOnLooping);
        }

        let tempFrame: number = this.$currentFrame;
        this.$currentFrame = this.start;

        if (this.$partTailNumList.indexOf(this.$currentFrame - 1) != -1) {//某个片段已播放至尾部帧
            //this.dispatchEventWith("AT_PART_TAIL", false, this.getPartIndexByFrame(this.$currentFrame));
            //this.emit("AT_PART_TAIL", this.getPartIndexByFrame(this.$currentFrame))

            if (!this.loopEnabled) {
                this.stop();
                // 对外发送完成一次循环的通知
                this.emit(GameEvent.ANIM_PART_LOOPED, { currentPartIndex: this.currentPartIndex, currentFrameInCurrentPart: this.currentFrameInCurrentPart });
                return;
            }
            else {
                // 对外发送完成一次循环的通知
                this.emit(GameEvent.ANIM_PART_LOOPED, { currentPartIndex: this.currentPartIndex, currentFrameInCurrentPart: this.currentFrameInCurrentPart });
            }
        }

        if (isDraw) {
            let texture: SpriteFrame = this.checkAndCreateTexture(this.$textureNameList[this.$currentFrame - 1]);
            this.animBG.getComponent(Sprite).spriteFrame = texture;
        }
        let index = this.getPartIndexByFrame(this.currentFrame);
        let cp = this.correctedPointArray[index];
        if (this.cs != this.correctedSpeedArray[index]) {
            let last_cs = this.cs;
            this.cs = this.correctedSpeedArray[index];
            this.setDriver(this.$driverType, this.playInterval * last_cs, this.$enforceStep);
        }

        this.animBG.uiTransform.anchorPoint = new math.Vec2(-cp.x / this.animBG.nodeWidth, -cp.y / this.animBG.nodeHeight);

        if (this.executeLoop && this.isPlaying && this.start == this.$loopStartFrame && this.start == this.$loopEndFrame) {
            //console.warn("提示: 循环点的起始帧号与结束帧号相同, 自动停止播放");
            this.stop();
        }

        if (this.callBackFunctionCollection && this.executeFrameScript && this.callBackFunctionCollection[this.$currentFrame - 1] && tempFrame != this.$currentFrame) {
            this.callBackFunctionCollection[this.$currentFrame - 1].call(null);
        }
        this.onUpDate && this.onUpDate(this);
    }

    protected autoPrevFrame(isDraw: boolean = true): void {
        if (this.start > 1) {
            this.start--;
            this.$isNatureEnter = true;
        }
        if (this.start < 1)//当播到最小帧时, 不会跳到最大帧开始倒播(Flash习惯)
        {
            this.start = 1;
        }
        this.$currentFrame = this.start;
        if (isDraw) {
            let texture: SpriteFrame = this.checkAndCreateTexture(this.$textureNameList[this.start - 1]);
            this.animBG.getComponent(Sprite).spriteFrame = texture;
        }

        let index = this.getPartIndexByFrame(this.currentFrame);
        let cp = this.correctedPointArray[index];

        this.animBG.uiTransform.anchorPoint = new math.Vec2(-cp.x / this.animBG.nodeWidth, -cp.y / this.animBG.nodeHeight);

        if (this.callBackFunctionCollection && this.executeFrameScript && this.callBackFunctionCollection[this.$currentFrame - 1]) {
            this.callBackFunctionCollection[this.$currentFrame - 1].call(null);
        }
        this.onUpDate && this.onUpDate(this);
    }

    /**
     * 时间轴往后推移一帧并停止播放
     * 
     */
    public nextFrame(): void {
        this.stop();
        if (this.start < this.$totalFrames) {
            this.autoNextFrame();
        }
    }

    /**
     * 时间轴往前推移一帧并停止播放
     * 
     */
    public prevFrame(): void {
        this.stop();
        if (this.start > 1) {
            this.autoPrevFrame();
        }

    }

    /**
     * 获得当前图像的纹理名称(该属性为只读)
     * @returns {string}
     * 
     */
    public get currentTextureName(): string {
        return this.$currentTextureName;
    }

    /**
     * 是否自然进入片段头
     * @returns {boolean}
     * 
     */
    public get isNatureEnter(): boolean {
        return this.$isNatureEnter;
    }

    /**
     * 当前播放头正所属片段, 在整个动画片段列表中的index(下标)
     * 
     */
    public get currentPartIndex(): number {
        return this.getPartIndexByFrame(this.$currentFrame);
    }

    /**
     * 获得片段头列表里的第index + 1个动画片段组合的片段头所在帧下标, 如果index是负数, 则返回倒数第 Math.abs(index) 个片段头所在帧下标
     * @param index 动画片段组列表序号下标
     * @returns {number}
     * 
     */
    public getPartHeadAt(index: number): number {
        index = Math.floor(index);
        if (index >= this.$partHeadNumList.length || index < -this.$partHeadNumList.length) {
            //console.warn("提示: 提供给 getPartHeadAt 的索引值超出片段头列表范围");
            return NaN;
        }
        if (index < 0) {
            index = this.$partHeadNumList.length + index;
        }
        return this.$partHeadNumList[index];
    }

    /**
     * 获得片段头列表里的第index + 1个动画片段组合的片段尾所在帧下标, 如果index是负数, 则返回倒数第 Math.abs(index) 个片段尾所在帧下标
     * @param index 动画片段组列表序号下标
     * @returns {number}
     * 
     */
    public getPartTailAt(index: number): number {
        index = Math.floor(index);
        if (index >= this.$partTailNumList.length || index < -this.$partTailNumList.length) {
            //console.warn("提示: 提供给 getPartTailAt 的索引值超出片段尾列表范围");
            return NaN;
        }
        if (index < 0) {
            index = this.$partTailNumList.length + index;
        }
        return this.$partTailNumList[index];
    }

    /**
     * 获得动画片段组合列表所有片段头和片段尾对象列表
     * @returns {Array<number>}
     * 
     */
    public getPartHeadAndTailList(): Array<HeadAndTail> {
        let htArray: Array<HeadAndTail> = new Array<HeadAndTail>();
        for (let i: number = 0; i < this.$partArray.length; i++) {
            htArray.push(new HeadAndTail(this.$partArray[i][0] - 1, this.$partArray[i][1] - 1));
        }

        return htArray;
    }

    /**
     * 获得片段头列表里的第index + 1片段头和片段尾对象
     * @returns {Array<number>}
     * 
     */
    public getPartHeadAndTailAt(index: number): HeadAndTail {
        index = Math.floor(index);
        if (index >= this.$partArray.length || index < -this.$partArray.length) {
            //console.warn("提示: 提供给 getPartHeadAt 的索引值超出片段头列表范围");
            return null;
        }
        if (index < 0) {
            index = this.$partArray.length + index;
        }

        return new HeadAndTail(this.$partHeadNumList[index], this.$partTailNumList[index]);
    }

    /**
     * 通过string 获得片段头列表里的第index + 1片段头和片段尾对象
     * @returns {Array<number>}
     * 
     */
    public getPartHeadAndTailByFlag(flag: string): HeadAndTail {
        if (!flag) {
            return null;
        }
        let index = this.getPartIndexByFlag(flag);

        return new HeadAndTail(this.$partHeadNumList[index], this.$partTailNumList[index]);
    }


    /**
     * 通过某一flag, 获得该帧号所处的动画组合片段在在动画列表中的下标
     * @param flag
     * @returns {number}
     * 
     */
    public getPartIndexByFlag(flag: string): number {
        if (!flag) {
            return NaN;
        }
        return this.partIndexDic[flag];
    }

    /**
     * 通过某一帧序号, 获得该帧号所处的动画组合片段在在动画列表中的下标
     * @param frame 帧序号
     * @returns {number}
     * 
     */
    public getPartIndexByFrame(frame: number): number {
        if (frame < 1 || frame > this.totalFrames) {
            throw new Error("帧号数值不在有效范围内");
        }

        frame = Math.floor(frame);

        for (let i: number = 0; i < this.$partArray.length; i++) {
            if (frame >= this.$partArray[i][0] && frame <= this.$partArray[i][1]) {
                return i;
            }
        }
    }

    /**
     * 通过某一partIndex, 获得该帧号所处的动画组合片段在在动画列表中的flag
     * @param index     part的下标
     * @returns {string}
     * 
     */
    public getPartFlagByIndex(index: number): string {
        return this.partFlagDic[index];
    }


    /**
    * 通过帧序号, 获得该帧号所处的动画组合片段在在动画列表中的flag
    * @param frame     帧序号
    * @returns {string}
    * 
    */
    public getPartFlagByFrame(frame: number): string {
        let index = this.getPartIndexByFrame(frame);
        return this.partFlagDic[index];
    }

    /**
     * 循环播放某一片段
     * @param partFlagOrIndex     片段序号下标
     * @param deltaFrame    相对片段头(head)的起始位置  例如head是85(帧序号为86) , deltaFrame == 5 时从第90帧开始播放
     * 
     */
    public gotoAndPlayInPart(partFlagOrIndex: number | string, deltaFrame: number = 1): void {
        let partIndex: any = partFlagOrIndex;
        if (typeof partFlagOrIndex == "string") {
            partIndex = this.getPartIndexByFlag(partFlagOrIndex);
            if (partIndex == -1) {
                console.warn("动画片段标签 " + partFlagOrIndex + " 不存在!");
                partIndex = 0;
            }
        }
        let part = this.getPartHeadAndTailAt(partIndex);
        if (deltaFrame > part.tail - part.head) {
            deltaFrame = 1;
        }
        this.setLoopPoint(part.head + 1, part.tail + 1);
        this.gotoAndPlay(part.head + deltaFrame);
    }

    /**
     * 跳进某一片段停并播放
     * @param partFlagOrIndex     片段序号下标
     * @param deltaFrame    相对片段头(head)的起始位置  例如head是85(帧序号为86), deltaFrame == 5 时跳到第90帧停止
     * 
     */
    public gotoAndStopInPart(partFlagOrIndex: number | string, deltaFrame: number = 1): void {
        let partIndex: any = partFlagOrIndex;
        if (typeof partFlagOrIndex == "string") {
            partIndex = this.getPartIndexByFlag(partFlagOrIndex);
        }
        let part = this.getPartHeadAndTailAt(partIndex);
        if (deltaFrame > part.tail - part.head) {
            deltaFrame = 1;
        }
        this.setLoopPoint(part.head + 1, part.tail + 1);
        this.gotoAndStop(part.head + deltaFrame);
    }

    /**
     * 循环播放当前片段
     * @param deltaFrame    相对片段头(head)的起始位置  例如head是85(帧序号为86) , deltaFrame == 5 时从第90帧开始播放
     * 
     */
    public playInPart(deltaFrame: number = 1): void {
        let partIndex = this.getPartIndexByFrame(this.currentFrame);
        let part = this.getPartHeadAndTailAt(partIndex);
        if (deltaFrame > part.tail - part.head) {
            deltaFrame = 1;
        }
        this.setLoopPoint(part.head + 1, part.tail + 1);
        this.gotoAndPlay(part.head + deltaFrame);
    }

    /**
     * 获得当前帧数相对于当前片段是第几帧
     * @returns currentFrameInCurrentPart
     * 
     */
    public get currentFrameInCurrentPart(): number {
        let partIndex = this.getPartIndexByFrame(this.currentFrame);
        let head = this.getPartHeadAt(partIndex);
        return this.currentFrame - head;
    }


    /* public set smoothing(bool: boolean) {
        this.animBG.smoothing = bool;
    }

    public get smoothing(): boolean {
        return this.animBG.smoothing;
    } */


    public destroy(): void {
        if (this.isDestroyed == true) {
            return;
        }
        this.animBG.getComponent(Sprite).unschedule(this.thisPlayHandler);
        this.stop();
        super.destroy();

        if (this.animBG && this.animBG.parent) {
            this.animBG.parent.removeChild(this.animBG);
        }

        this.animBG = null;
        this.callBackFunctionCollection = null;

        this.$partArray = null;
        this.$partHeadNumList = null;
        this.$partTailNumList = null;
        this.correctedPointArray = null;
        this.correctedSpeedArray = null;
        this.textureInfoList = null;
        this.$textureNameList = null;
        this.textureSource = null;
        this.flagObject = null;
    }

    public set fps(value:number) {
        this.playInterval = 1 / value;
        this.setDriver( disTypes.DriverType.TIMER, this.playInterval);
    }

    public get fps():number {
        return Math.round(1 / this.playInterval);
    }

    /**
     * 自定义时间轴驱动方式和速度
     * @param driverType  时间轴驱动的方式, 逐帧disTypes.DriverType.FRAME 或 计时器 disTypes.DriverType.TIMER
     * @param playInterval 播放时每一帧的间隔, 如果type是 disTypes.DriverType.FRAME, playInterval的单位就是帧, 理论帧频等于 帧频 / playInterval;如果type是  disTypes.DriverType.TIMER, playInterval的单位就是豪秒, 理论帧频等于 1000 / playInterval;
     * @param enforceStep 是否强制执行帧同步。如果设为 true，将通过计算实际帧频，自动遍历过因降帧而丢失的帧数，以达到与默认帧频同步的效果
     * 
     */
    public setDriver(driverType: string = disTypes.DriverType.TIMER, playInterval: number = 1 / 60, enforceStep: boolean = this.$enforceStep): void {
        if (playInterval <= 0) {
            throw new Error("驱动间隔不能等于或小于0！");
        }
        driverType = disTypes.DriverType.TIMER;
        if (!this.executeDriverType) return;
        this.$driverType = driverType;
        this.playInterval = playInterval / this.cs;
        this.$driverTypeOnLooping = this.$driverType;
        this.$playIntervalOnLooping = this.playInterval;
        this.$enforceStep = enforceStep;
        this.currentInterval = 0;
        this.lastStepTime = Date.now();

        if (driverType == disTypes.DriverType.FRAME && this.playInterval % 1 != 0) {
            //console.warn("提示: 当前采用逐帧驱动方式, playInterval不是整数(" + this.playInterval + "), 将会出现丢帧的情况");
        }
        else if (driverType == disTypes.DriverType.TIMER && this.playInterval < 16) {
            //console.warn("提示: 当前采用计时器驱动方式, playInterval低于下限16毫秒(" + this.playInterval + "), 将自动调整为 帧/16毫秒 的频率");
        }
        if (this.isPlaying) {
            this.animBG.getComponent(Sprite).unschedule(this.thisPlayHandler);
            this.play();
        }
    }


    private $frameInterval: number = 1;
    /**
     * 设置两帧之间的逐帧间隔(ENTER_FRAME实际执行几次,本动画的帧数才+1,数值越大越慢), 并把当前时间轴驱动的方式改为逐帧驱动
     * @param frameInterval
     * 
     */
    public set frameInterval(frameInterval: number) {
        this.setDriver(disTypes.DriverType.FRAME, frameInterval, this.$enforceStep);
        this.$frameInterval = frameInterval;
    }

    public get frameInterval(): number {
        return this.$frameInterval;
    }


    private $frameScale: number = 1;
    /**
     * 设置动画帧速率(把动画的播放速度设置为ENTER_FRAME的几倍, 数值越大越快), 并把当前时间轴驱动的方式改为逐帧驱动
     * @param frameScale
     * 
     */
    public set frameScale(frameScale: number) {
        this.setDriver(disTypes.DriverType.FRAME, 1 / frameScale, this.$enforceStep);
        this.$frameScale = frameScale;
    }

    public get frameScale(): number {
        return this.$frameScale;
    }

    /**
     * 设置两帧之间的时间间隔(TIMER经过了多少秒,本动画的帧数才+1,数值越大越慢), 并把当前时间轴驱动的方式改为计时器驱动
     * @param interval
     * 
     */
    public set timerInterval(interval: number) {
        this.setDriver(disTypes.DriverType.TIMER, interval, this.$enforceStep);
    }

    /**
     * 设置每秒播放的帧数(数值越大越快), 并把当前时间轴驱动的方式改为计时器驱动
     * @param fps
     * 
     */
    public set timerFPS(fps: number) {
        this.setDriver(disTypes.DriverType.TIMER, 1000 / fps, this.$enforceStep);
    }

    /**
    * 设置强制帧同步
    * @param es
    * 
    */
    public set enforceStep(es: boolean) {
        this.setDriver(this.$driverType, this.playInterval, es);
    }

    public get enforceStep(): boolean {
        return this.$enforceStep;
    }

    public get driverType(): string {
        return this.$driverType;
    }
}


export class TextureInfoMaker {
    constructor() {
        throw new Error(this["__class__"] + " 是静态成员集成类, 无需实例化");
    }

    /**
     *
     * @param texturePrefix 纹理集名称前缀, 用于与后缀序号组合出纹理集名称。如果texturePrefix为空值, 将根据根据第一个参数(total)创建出total个无名的空白帧,而texturePrefix之后的参数不再有任何意义
     * @param total   纹理集序列元素的总个数,直接关系到动画片段的总帧数
     * @param minIndex   纹理集名称后缀序号最小值,用于与前缀名称组合出纹理集名称。
     * @param digits    纹理集名称后缀序列长度
     * @param flag   该动画片段的flag
     * @param props    {@param cx:bitmap 修正x坐标  @param cy:bitmap 修正x坐标 @param frameScale:播放速度比例因子}
     * @returns {TextureInfo}
     * 
     */
    public static createInfo(texturePrefix: string, total: number, minIndex: number, digits: number, flag: string, props?: { cx?: number, cy?: number, frameScale?: number }): TextureInfo

    /**
     *
     * @param texturePrefix 纹理集名称前缀, 用于与后缀序号组合出纹理集名称。如果texturePrefix为空值, 将根据根据第一个参数(total)创建出total个无名的空白帧,而texturePrefix之后的参数不再有任何意义
     * @param textureSuffix 纹理集名称后缀, 例如"_png"
     * @param total   纹理集序列元素的总个数,直接关系到动画片段的总帧数
     * @param minIndex   纹理集名称后缀序号最小值,用于与前缀名称组合出纹理集名称。
     * @param digits    纹理集名称后缀序列长度
     * @param flag   该动画片段的flag
     * @param props    {@param cx:bitmap 修正x坐标  @param cy:bitmap 修正x坐标 @param cs:播放速度比例因子}
     * @returns {TextureInfo}
     * 
     */
    public static createInfo(texturePrefix: string, textureSuffix: string, total: number, minIndex: number, digits: number, flag: string, props?: { cx?: number, cy?: number, cs?: number }): TextureInfo

    public static createInfo(...args): TextureInfo {
        let texturePrefix: string, textureSuffix: string, total: number, minIndex: number, digits: number, flag: string, cx: number, cy: number, cs: number;
        if (Object.prototype.toString.call(args[1]) == "[object String]") {
            texturePrefix = args[0];
            textureSuffix = args[1];
            total = args[2];
            minIndex = args[3];
            digits = args[4];
            flag = args[5];
            if (args[6]) {
                cx = args[6].cx;
                cy = args[6].cy;
                cs = args[6].cs;
            }
        }
        else {
            texturePrefix = args[0];
            textureSuffix = "";
            total = args[1];
            minIndex = args[2];
            digits = args[3];
            flag = args[4];
            if (args[5]) {
                cx = args[5].cx;
                cy = args[5].cy;
                cs = args[5].cs;
            }
        }

        if (total < 1) {
            throw new Error("Texture对象列表长度不能小于1");
            //return null;
        }
        if (digits < 1) {
            throw new Error("Texture对象的序号长度不能小于1");
            //return null;
        }
        let maxIndex = total + minIndex;
        let nameArray: Array<string> = new Array<string>();

        digits = Math.floor(digits);
        for (let i: number = Math.floor(minIndex); i < Math.floor(maxIndex); i++) {
            if (texturePrefix == null) {
                nameArray.push(null);
            }
            else {
                nameArray.push(texturePrefix + this.getFrameByDigits(i, digits) + textureSuffix);
            }

        }

        let textureInfo: TextureInfo = new TextureInfo(nameArray, flag, new math.Vec2(cx, cy), cs);

        return textureInfo;
    }

    /**
     *
     * @param texturePrefix 纹理集名称前缀, 用于与后缀序号组合出纹理集名称。如果texturePrefix为空值, 将根据根据第一个参数(total)创建出total个无名的空白帧,而texturePrefix之后的参数不再有任何意义
     * @param startIndex   纹理集名称后缀序号起始位置,用于与前缀名称组合出纹理集名称。
     * @param endIndex   纹理集名称后缀序号结束位置,用于与前缀名称组合出纹理集名称。
     * @param digits    纹理集名称后缀序列长度
     * @param flag   该动画片段的flag
     * @param props  修正数值 {@param cx:bitmap 修正x坐标  @param cy:bitmap 修正x坐标 @param cs:播放速度比例因子}
     *  
     * @returns {TextureInfo}
     * 
     */
    public static createInfoStart2End(texturePrefix: string, startIndex: number, endIndex: number, digits: number, flag?: string, props?: { cx?: number, cy?: number, cs?: number }): TextureInfo

    /**
     *
     * @param texturePrefix 纹理集名称前缀, 用于与后缀序号组合出纹理集名称。如果texturePrefix为空值, 将根据根据第一个参数(total)创建出total个无名的空白帧,而texturePrefix之后的参数不再有任何意义
     * @param textureSuffix 纹理集名称后缀, 例如"_png"
     * @param startIndex   纹理集名称后缀序号起始位置,用于与前缀名称组合出纹理集名称。
     * @param endIndex   纹理集名称后缀序号结束位置,用于与前缀名称组合出纹理集名称。
     * @param digits    纹理集名称后缀序列长度
     * @param flag   该动画片段的flag
     * @param props  修正数值 {@param cx:bitmap 修正x坐标  @param cy:bitmap 修正x坐标 @param cs:播放速度比例因子}
     * @returns {TextureInfo}
     * 
     */
    public static createInfoStart2End(texturePrefix: string, textureSuffix: string, startIndex: number, endIndex: number, digits: number, flag?: string, props?: { cx?: number, cy?: number, cs?: number }): TextureInfo

    public static createInfoStart2End(...args): TextureInfo {
        
        let startIndex: number, endIndex: number;
        let texturePrefix: string, textureSuffix: string, total: number, minIndex: number, digits: number, flag: string, cx: number, cy: number, cs: number;
        if (Object.prototype.toString.call(args[1]) == "[object String]") {
            texturePrefix = args[0];
            textureSuffix = args[1];
            startIndex = args[2];
            endIndex = args[3];
            total = endIndex - startIndex + 1;
            minIndex = startIndex;
            digits = args[4];
            flag = args[5];
            if (args[6]) {
                cx = args[6].cx;
                cy = args[6].cy;
                cs = args[6].cs;
            }
        }
        else {
            texturePrefix = args[0];
            textureSuffix = "";
            startIndex = args[1];
            endIndex = args[2];
            total = endIndex - startIndex + 1;
            minIndex = startIndex;
            digits = args[3];
            flag = args[4];
            if (args[5]) {
                cx = args[5].cx;
                cy = args[5].cy;
                cs = args[5].cs;
            }
        }

        if (startIndex > endIndex) {
            throw new Error("Texture对象起始位置的index " + startIndex + "  不能大于结束位置的index " + endIndex);
            //return null;
        }
        if (digits < 1) {
            throw new Error("Texture对象的序号长度不能小于1");
            //return null;
        }
        let maxIndex = total + minIndex;
        let nameArray: Array<string> = new Array<string>();

        digits = Math.floor(digits);
        for (let i: number = Math.floor(minIndex); i < Math.floor(maxIndex); i++) {
            if (texturePrefix == null) {
                nameArray.push(null);
            }
            else {
                nameArray.push(texturePrefix + this.getFrameByDigits(i, digits) + textureSuffix);
            }
        }

        let textureInfo: TextureInfo = new TextureInfo(nameArray, flag, new math.Vec2(cx, cy), cs);
        return textureInfo;
    }

    /**
     *
     * 创建图像内容固定不变的静态片段纹理信息。在静态片段中，每一帧所使用的纹理名称也是唯一和相同的。该片段相当于一张图片或无任何内容的关键帧从片段头开始至片段尾结束的延长帧
     * @param textureName   静态片段所显示的图像的纹理名称。如果该值为null或"",则显示为空白图像
     * @param total   静态片段图像持续存在的帧数
     * @param flag   该动画片段的flag
     * @param props  修正数值  {@param cx:bitmap 修正x坐标  @param cy:bitmap 修正x坐标 @param cs:播放速度比例因子}
     * @returns {any}
     * 
     */
    public static createStaticInfo(textureName: string = null, total: number = 1, flag: string = "", props?: { cx?: number, cy?: number, cs?: number }): TextureInfo {
        if (total < 1) {
            throw new Error("Texture对象列表长度不能小于1");
            //return null;
        }

        let nameArray: Array<string> = new Array<string>();

        for (let i: number = 0; i < total; i++) {
            if (textureName == null || textureName == "") {
                nameArray.push("(╯‵□′)╯︵┻━┻(T﹏T)");//无效纹理地址
            }
            else {
                nameArray.push(textureName);
            }
        }

        let textureInfo: TextureInfo = new TextureInfo(nameArray, flag, new math.Vec2(props.cx, props.cy), props.cs);

        return textureInfo;
    }

    private static getFrameByDigits(frame: number, digits: number): string {
        if (digits < 1) {
            digits = 1;
        }
        digits = Math.floor(digits);
        let str: string = frame.toString();
        while (str.length < digits) {
            str = 0 + str;
        }
        return str;
    }
}

class TextureInfo {
    public nameArray: Array<string>;
    public flag: string = "";
    public correctedPoint: math.Vec2;
    public cs: number;

    public constructor(nameArray: Array<string>, flag: string = "", correctedPoint: math.Vec2 = new math.Vec2(0, 0), cs: number = 1) {
        this.nameArray = nameArray;
        this.flag = flag;
        this.correctedPoint = correctedPoint;
        this.cs = cs;
        if (this.cs <= 0 || isNaN(this.cs)) {
            this.cs = 1;
        }
    }

    /**
     * 返回一个逆向播放序列帧的纹理集信息，可以实现动画的倒播
     * @param correctedPoint    修正坐标参数
     * 
     */
    public reverse(correctedPoint: math.Vec2 = new math.Vec2(this.correctedPoint.x, this.correctedPoint.y)): TextureInfo {
        let reverseArray = this.nameArray.concat().reverse();

        return new TextureInfo(reverseArray, this.flag, correctedPoint, this.cs);
    }
}

class HeadAndTail {
    /**
     * 头部帧下标 等于头部帧数-1
     *
     */
    public head: number;

    /**
     * 尾部帧下标 等于尾部帧数-1
     *
     */
    public tail: number;

    public constructor(head: number, tail: number) {
        this.head = head;
        this.tail = tail;
    }

    /**
     * 获得片段的总帧数, 最小不少于1帧
     * 
     */
    public get totalFrames(): number {
        return this.tail - this.head + 1;
    }
}
