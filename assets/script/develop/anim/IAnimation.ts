/**
 * Created by YeXin on 2016/1/9.
 */

interface IAnimation extends IDisplayObjectLite {
    addFrameScript(frameIndex: number, callFunction: Function, thisObj: any, withImmediateEffect: boolean): void;
    removeFrameScript(frameIndex: number): void;
    stop(): void;
    play(): void;
    gotoAndPlay(frame: number): void;
    gotoAndStop(frame: number): void;
    nextFrame(): void;
    prevFrame(): void;
    setDriver(driverType: string, playInterval: number, enforceStep: boolean): void;
    setLoopPoint(loopStartFrame: number, loopEndFrame: number, gotoAndPlayNow: boolean, driverTypeOnLooping: string, playIntervalOnLooping: number): void;
    clearLoopPoint(): void;
    onUpDate: Function;
    destroy(): void;


    totalFrames: number;
    currentFrame: number;
    startIndex: number;
    executeFrameScript: boolean;
    executeLoop: boolean;
    executeDriverType: boolean;
}
