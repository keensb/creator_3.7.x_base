import {Node, CCInteger, CCString, _decorator } from "cc";

//提供给组件 AnimationGroupComponent 的3级预设参数类, 本质上是一个VO (value object)
const { ccclass, property} = _decorator;

@ccclass('KeyFrameEvent')
export class KeyFrameEvent {
    
    @property({ type:Node, tooltip: "负责发送此消息的节点实例(非必要, 默认是本组件的节点 this.node, 同时也应该是监听此消息通知的节点实例)" })
    public dispatcher: Node;

    @property({tooltip: "关键帧在当前片段中的相对Index(必要, 这里使用的是Flash的addFrameScript习惯,\n帧数下标也就是目标帧数-1 例如你想在本片段的第20帧发送消息通知, frameIndex就等于19)" })
    public frameIndex: number = 0;

    @property({tooltip: "将要发送的消息内容(必要, 同时也应该是被节点监听的字段)" })
    public eventType: string = "";

    @property({tooltip: "本次消息通知附带的参数(非必要, 字符串格式, 如果需要发送多个参数内容, 建议用逗号分隔或写成json格式)" })
    public data: string = ""; 
}