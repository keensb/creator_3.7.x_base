

/**
 * Created by YeXin on 2015/12/12.
 */

import { Node, Sprite, SpriteFrame } from "cc";

/**
 * 从基础序列动画帧集组成的纹理集创建自定义的影片剪辑
 * (注意:纹理集在配置文件default.res.json中声明的type必须是"sheet", url后缀必须是 ".json" 如果不能正常输出动画又没有报错提示、浏览器在打开时崩溃，请优先检查此两项)
 */
export class AnimationLite extends Node
{
    private $spriteFrames: Array<any>;
    private $frameInterval: number;
    private $currentIndex: number;
    private $animate: Sprite;

    private $defaultSpriteFrames: SpriteFrame[] | SpriteFrame[][] | string[] | string[][];

    /**是否开启强制同步:一旦开启强制同步,将通过跳帧的方式,让理论帧频突破web动画60帧/秒的限制*/
    private $syncForce: boolean = false;
    

    /**
     * @param spriteFrames 纹理资源集合，通过在指定的单位时间内不断替换内容实现播放效果
     * @param framesPerSecond 影片剪辑在播放时的帧频(播放速度 fps)
     * @param startFrame 初始序号变量,决定影片剪辑在初始化时的时间轴停留在那一帧上。建议是不小于1的整数
     * @param autoPlayOnInit  是否在构建和初始化完毕后就开始自动播放
     */
    constructor(spriteFrames?: SpriteFrame[] | SpriteFrame[][] | string[] | string[][], framesPerSecond: number = 60, startFrame: number = 1, autoPlayOnInit: boolean = true)
    {
        super();
        
        this.$animate = this.addComponent(Sprite);
        if (spriteFrames) {
            this.$defaultSpriteFrames = spriteFrames;
            this.reconstruct(spriteFrames, framesPerSecond, startFrame, autoPlayOnInit);
        }
    }

    /**
     * 重新构建影片剪辑信息,并可替换纹理集资源指针
     * @param spriteFrames 纹理资源集合，通过在指定的单位时间内不断替换内容实现播放效果
     * @param framesPerSecond 影片剪辑在播放时的帧频(播放速度 fps)
     * @param startFrame 初始序号变量,决定影片剪辑在初始化时的时间轴停留在那一帧上。建议是不小于1的整数
     * @param autoPlayOnInit  是否在构建和初始化完毕后就开始自动播放
     */
    public reconstruct(spriteFrames: SpriteFrame[] | SpriteFrame[][] | string[] | string[][] = this.$defaultSpriteFrames, framesPerSecond: number = 60, startFrame: number = 1, autoPlayOnInit: boolean = true): void
    {
        this.$defaultSpriteFrames = spriteFrames;
        if (!spriteFrames)
        {
            throw new Error("动画纹理集合不能为空");
        }
        if (spriteFrames[0]["length"])
        {
            this.$spriteFrames = [];
            for (let i = 0; i < spriteFrames.length; i++)
            {
                this.$spriteFrames = this.$spriteFrames.concat(spriteFrames[i]);
            }
        }
        else
        {
            this.$spriteFrames = [].concat(spriteFrames);
        }
        if (framesPerSecond <= 0)
        {
            throw new Error("播放时间间隔不能小于或等于0");
        }
        this.$frameInterval = 1 / framesPerSecond;
        if (this.$spriteFrames.length < 1)
        {
            throw new Error("动画列表没有任何SpriteFrame对象");
        }

        startFrame = Math.ceil(startFrame);

        if (startFrame < 1 || startFrame > this.$spriteFrames.length)
        {
            throw new Error("初始帧数值不在有效范围内");
        }

        this.callFuncArr = null;
        this.$currentIndex = startFrame - 1;
        this.$animate.asyncSpriteFrame = this.$spriteFrames[this.$currentIndex];

        if (autoPlayOnInit)
        {
            this.play();
        }
    }

    public get totalFrame(): number
    {
        return this.$spriteFrames.length;
    }

    public get currentFrame(): number
    {
        return this.$currentIndex + 1;
    }

    public get isPlaying(): boolean
    {
        return this.$isPlaying;
    }

    /**
     * 影片剪辑在播放时的帧频(播放速度 fps)
     */
    public set framesPerSecond(value: number)
    {
        if (value <= 0)
        {
            throw new Error("播放时间间隔不能小于或等于0");
        }
        if (this.$isPlaying)
        {
            this.$animate.unschedule(this.playHandlerSelf);
        }
        this.$frameInterval = 1 / value;
        if (this.$isPlaying)
        {
            this.$animate.schedule(this.playHandlerSelf, this.$frameInterval);
        }
    }

    public get framesPerSecond(): number
    {
        return 1 / this.$frameInterval;
    }

    private playHandlerSelf: Function;
    private $isPlaying: boolean = false;

    public play(): void
    {
        if (!this.playHandlerSelf)
        {
            this.playHandlerSelf = this.playHandler.bind(this);
        }
        this.$animate.asyncSpriteFrame = this.$spriteFrames[this.$currentIndex];

        this.$animate.unschedule(this.playHandlerSelf);
        this.$isPlaying = true;
        this.$animate.schedule(this.playHandlerSelf, this.$frameInterval);
    }

    public gotoAndPlay(frameNumber: number): void
    {
        frameNumber = Math.ceil(frameNumber);
        if (frameNumber < 1 || frameNumber > this.$spriteFrames.length)
        {
            throw new Error("数值不在有效范围内");
        }

        this.$currentIndex = frameNumber - 1;
        this.play();

        if (this.callFuncArr && this.callFuncArr[this.$currentIndex])
        {
            let func = this.callFuncArr[this.$currentIndex][0];
            let isOnce = this.callFuncArr[this.$currentIndex][1];
            let f = this.$currentIndex + 1;

            if (isOnce)
            {
                this.removeFrameScript(f);
            }
            func.call(null, func["params"]);
        }
    }

    public stop(): void
    {
        this.$isPlaying = false;
        this.$animate.asyncSpriteFrame = this.$spriteFrames[this.$currentIndex];
        this.$animate.unschedule(this.playHandlerSelf);
    }

    public gotoAndStop(frameNumber: number): void
    {
        frameNumber = Math.ceil(frameNumber);
        if (frameNumber < 1 || frameNumber > this.$spriteFrames.length)
        {
            throw new Error("数值不在有效范围内");
        }

        this.stop();
        this.$currentIndex = frameNumber - 1;
        this.$animate.asyncSpriteFrame = this.$spriteFrames[this.$currentIndex];

        if (this.callFuncArr && this.callFuncArr[this.$currentIndex])
        {
            let func = this.callFuncArr[this.$currentIndex][0];
            let isOnce = this.callFuncArr[this.$currentIndex][1];
            let f = this.$currentIndex + 1;

            if (isOnce)
            {
                this.removeFrameScript(f);
            }
            func.call(null, func["params"]);
        }
    }

    public nextFrame(): void
    {
        this.stop();
        if (this.$currentIndex < this.$spriteFrames.length - 1)
        {
            this.$currentIndex++;
            this.$animate.asyncSpriteFrame = this.$spriteFrames[this.$currentIndex];
            if (this.callFuncArr && this.callFuncArr[this.$currentIndex])
            {
                let func = this.callFuncArr[this.$currentIndex][0];
                let isOnce = this.callFuncArr[this.$currentIndex][1];
                let f = this.$currentIndex + 1;
                if (isOnce)
                {
                    this.removeFrameScript(f);
                }
                func.call(null, func["params"]);
            }
        }
    }

    public prevFrame(): void
    {
        this.stop();
        if (this.$currentIndex > 1)
        {
            this.$currentIndex--;
            this.$animate.asyncSpriteFrame = this.$spriteFrames[this.$currentIndex];
            if (this.callFuncArr && this.callFuncArr[this.$currentIndex])
            {
                let func = this.callFuncArr[this.$currentIndex][0];
                let isOnce = this.callFuncArr[this.$currentIndex][1];
                let f = this.$currentIndex + 1;
                if (isOnce)
                {
                    this.removeFrameScript(f);
                }
                func.call(null, func["params"]);
            }
        }
    }

    private callFuncArr: Array<any>;
    /**
     * 在指定帧数上添加回调事件
     * @param frameNumber 指定帧数
     */
    public addFrameScript(frameNumber: number, callBackFunction: Function, thisObj?: any, ...params): AnimationLite
    {
        frameNumber = Math.ceil(frameNumber);
        if (frameNumber < 1 || frameNumber > this.$spriteFrames.length)
        {
            throw new Error("当前目标帧数 → " + frameNumber + ", 不在有效范围(从1到" + this.$spriteFrames.length + ")内");
        }
        if (!this.callFuncArr)
        {
            this.callFuncArr = [];
        }
        let func = callBackFunction.bind(thisObj);
        func["params"] = params;
        this.callFuncArr[frameNumber - 1] = [func, false];
        return this;
    }

    /**
     * 在指定帧数上添加只执行一次的回调事件;注意:如果把两个事件都先后注册在同一个帧号上,那么后事件将覆盖前事件
     * @param frameNumber 指定帧数
     */
    public addFrameScriptOnce(frameNumber: number, callBackFunction: Function, thisObj?: any, ...params): AnimationLite
    {
        frameNumber = Math.ceil(frameNumber);
        if (frameNumber < 1 || frameNumber > this.$spriteFrames.length)
        {
            throw new Error("当前目标帧数 → " + frameNumber + ", 不在有效范围(从1到" + this.$spriteFrames.length + ")内");
        }
        if (!this.callFuncArr)
        {
            this.callFuncArr = [];
        }
        let func = callBackFunction.bind(thisObj);
        func["params"] = params;
        this.callFuncArr[frameNumber - 1] = [func, true];
        return this;
    }

    /**
    * 移除在指定帧数上添加的回调事件
    * @param frameNumber 指定帧数
    */
    public removeFrameScript(frameNumber: number): AnimationLite
    {
        frameNumber = Math.ceil(frameNumber);
        if (frameNumber < 1 || frameNumber > this.$spriteFrames.length)
        {
            throw new Error("当前目标帧数 → " + frameNumber + ", 不在有效范围(从1到" + this.$spriteFrames.length + ")内");
        }

        if (this.callFuncArr)
        {
            this.callFuncArr[frameNumber - 1] = null;
        }
        return this;
    }

    

    private currentDt = 0;
    private lastDt = 0;
    private playHandler(dt): void
    {
        this.$isPlaying = true;
        if (!this.syncForce)
        {
            this.$currentIndex++;
            if (this.$currentIndex >= this.$spriteFrames.length)
            {
                this.$currentIndex = 0;
            }
            this.$animate.asyncSpriteFrame = this.$spriteFrames[this.$currentIndex];

            if (this.callFuncArr && this.callFuncArr[this.$currentIndex])
            {
                let func = this.callFuncArr[this.$currentIndex][0];
                let isOnce = this.callFuncArr[this.$currentIndex][1];
                let f = this.$currentIndex + 1;

                if (isOnce)
                {
                    this.removeFrameScript(f);
                }
                func.call(null, func["params"]);
                /** 
                问题:为什么 
                    this.removeFrameScript(f) 
                    要在 
                    func.call(null, func["params"]) 
                    之前执行?

                答案: 像以下代码
                //第一次注册一次性事件
                this.anim.addFrameScriptOnce(1, () => 
                {
                    trace("hello!");
                    //当一次性事件被执行时,再次注册一次性事件
                    this.anim.addFrameScriptOnce(1, () => 
                    { 
                        trace("nihao!!") 
                    })
                });
                在删除一个旧的帧事件同时又添加一个新的帧事件,必须先清除该帧原本的事件,再添加新的事件;
                如果先添加新的帧事件(覆盖旧事件),再清除该帧原本的事件,那么会导致新旧事件均被清除
                */
            }
        }
        else if (this.syncForce)
        {
            this.currentDt = dt + this.lastDt;
            this.lastDt = this.currentDt % this.$frameInterval;
            //this.currentDt -= this.$frameInterval;
            while (this.currentDt >= this.$frameInterval && this.isPlaying && this.syncForce)
            {
                //trace(this.currentDt,this.$frameInterval)
                this.forceFix(this.currentDt);
            }
            this.$animate.asyncSpriteFrame = this.$spriteFrames[this.$currentIndex];//跳帧播放完毕时再渲染纹理
        }

    }

    private forceFix(dt): void
    {
        this.$currentIndex++;
        if (this.$currentIndex >= this.$spriteFrames.length)
        {
            this.$currentIndex = 0;
        }
        //this.$animate.asyncSpriteFrame = this.$spriteFrames[this.$currentIndex];//跳帧播放时不必渲染纹理

        if (this.callFuncArr && this.callFuncArr[this.$currentIndex])
        {
            let func = this.callFuncArr[this.$currentIndex][0];
            let isOnce = this.callFuncArr[this.$currentIndex][1];
            let f = this.$currentIndex + 1;

            if (isOnce)
            {
                this.removeFrameScript(f);
            }
            func.call(null, func["params"]);//跳过渲染但是不跳过帧事件的执行
        }
        //trace("this.currentFrame",this.currentFrame)
        this.currentDt -= this.$frameInterval;
    }

    /**是否开启强制同步 一旦开启强制同步,将通过跳帧的方式,让理论帧频突破60帧/秒的限制*/
    public set syncForce(value: boolean)
    {
        this.$syncForce = value;
        this.lastDt = 0;
    }

    public get syncForce(): boolean
    {
        return this.$syncForce;
    }

    
    public destroy(): boolean
    {
        this.stop();
        this.$animate.unscheduleAllCallbacks();
        this.$spriteFrames = null;
        this.callFuncArr = null;
        this.$animate.destroy();
        super.destroy();
        return true;
    }


}
