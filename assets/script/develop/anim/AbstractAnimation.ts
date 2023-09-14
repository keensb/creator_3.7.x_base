/**
 * Created by YeXin on 2016/1/9.
 */
import {EventTarget, Scene, Node,SpriteFrame, director } from "cc";
import { disTypes } from "../types/disType";

/**
 * 动画抽象类
 */
export abstract class AbstractAnimation extends EventTarget implements IAnimation {
    protected $totalFrames: number;//最大帧数
    protected $currentFrame: number;//当前帧数

    protected $loopStartFrame: number = 0;
    protected $loopEndFrame: number = 0;
    protected $driverTypeOnLooping: string;
    protected $playIntervalOnLooping: number;
    protected $enforceStep: boolean = false;

    protected $startIndex: number = 0;

    protected $isPlaying: boolean;
    protected callBackFunctionCollection: Array<Function>;//帧事件回调数组

    protected $staticStage: Scene;

    protected $driverType: string = disTypes.DriverType.FRAME;
    protected playInterval: number = 1;
    protected currentInterval: number = 0;
    protected lastStepTime: number = 0;


    public executeFrameScript: boolean = true;//是否允许执行帧脚本
    public executeLoop: boolean = true;//是否允许执行自定义循环点
    public executeDriverType: boolean = true;//是否允许按自己的驱动方式执行

    public hashCode: number;

    public textureSource: { [key: string]: SpriteFrame};//纹理集数据源

    public onUpDate: Function;//动画播放时的同步回调 主要用途 例如一个角色使用相同的纹理作为影子时 同步本体与影子的动作

    private static $hashCode: number = 0;

    protected animBG: Node;

    

    public constructor(animBG: Node) {
        super();
        this.animBG = animBG;
    }

    public clone(): AbstractAnimation {
        return this;
    }

    public addFrameScript(frameIndex: number, callFunction: Function, thisObj: any, withImmediateEffect: boolean): void {

    }

    public addFrameScriptOnce(frameIndex: number, callFunction: Function, thisObj: any, withImmediateEffect?: boolean): void {

    }

    public removeFrameScript(frameIndex: number): void {

    }

    public stop(): void {

    }

    public play(): void {

    }

    public gotoAndPlay(frame: number): void {

    }

    public gotoAndStop(frame: number): void {

    }

    public nextFrame(): void {

    }

    public prevFrame(): void {

    }


    protected playHandler(event = null): void {

    }

    /**
     * 获得总帧数(该属性为只读)
     * @returns {number}
     */
    public get totalFrames(): number {
        return this.$totalFrames;
    }

    /**
     * 获得当前帧数(该属性为只读)
     * @returns {number}
     */
    public get currentFrame(): number {
        return this.$currentFrame;
    }

    /**
    * 设置最初的起始帧下标
    */
    public set startIndex(index: number) {
        if (index < 0) {
            index = 0;
        }
        this.$startIndex = Math.floor(index);
    }

    /**
     * 获取最初的起始帧下标
     */
    public get startIndex(): number {
        return this.$startIndex;
    }

    /**
     * 判断影片剪辑当前是否正在播放(该属性为只读)
     * @returns {boolean}
     */
    public get isPlaying(): boolean {
        return this.$isPlaying;
    }

    public setDriver(driverType: string = disTypes.DriverType.FRAME, playInterval: number = 1, enforceStep: boolean = this.$enforceStep): void {

    }

    /**
     * 设置定点循环播放的片段
     * @param loopStartFrame    片段起始帧号(含)
     * @param loopEndFrame      片段末尾帧号(含)
     * @param gotoAndPlayNow    是否立即跳到循环片段的起始帧号并播放
     * @param driverTypeOnLooping    在自定义循环时改变驱动方式
     * @param playIntervalOnLooping    在自定义循环时改变帧间隔时间
     * @param enforceStep    是否在自定义循环时强制帧同步
     */
    public setLoopPoint(loopStartFrame: number, loopEndFrame: number, gotoAndPlayNow: boolean = false, driverTypeOnLooping: string = this.$driverType, playIntervalOnLooping: number = this.playInterval, enforceStep: boolean = this.$enforceStep): void {
        if (loopStartFrame < 1 || loopEndFrame > this.$totalFrames) {
            throw new Error("循环播放片段起始帧或结束帧超出范围！");
            //return;
        }

        if (loopStartFrame > loopEndFrame) {
            throw new Error("循环播放片段起始帧号不能大于结束帧号！");
            //return;
        }

        this.$loopStartFrame = Math.floor(loopStartFrame);
        this.$loopEndFrame = Math.floor(loopEndFrame);
        this.$driverTypeOnLooping = driverTypeOnLooping;
        this.$playIntervalOnLooping = playIntervalOnLooping;
        this.$enforceStep = enforceStep;


        if (this.executeLoop && gotoAndPlayNow) {
            this.gotoAndPlay(loopStartFrame);
        }
    }

    public get display():Node { 
        return this.animBG;
    }

    //通过修改宽度值来缩放横向比例
    public set scaleWidth(value: number) {
        this.animBG.scaleX = value / this.animBG.nodeWidth;
    }

    //通过修改高度值来缩放纵向比例
    public set scaleHeight(value: number) {
        this.animBG.scaleY = value / this.animBG.nodeHeight;
    }

    public get scaleWidth(): number {
        return this.animBG.nodeWidth * this.animBG.scaleX;
    }

    public get scaleHeight(): number {
        return this.animBG.nodeHeight * this.animBG.scaleY;
    }

    /**
     * 清除定点循环播放的片段
     */
    public clearLoopPoint(): void {
        this.$loopStartFrame = 0;
        this.$loopEndFrame = 0;
    }

    protected $isDestroyed: boolean = false;
    public destroy(): void {
        if (this.$isDestroyed) return;
        this.$isDestroyed = true;
        this.stop();
        //Laya.timer.clear(this, this.playHandler);
        director.getScheduler().unschedule(this.playHandler, this.animBG);
        if (this.animBG && this.animBG.parent) {
            this.animBG.parent.removeChild(this.animBG);
        }
        this.animBG = null;
        this.$staticStage = null;
    }

    public get isDestroyed(): boolean {
        return this.$isDestroyed;
    }
}

