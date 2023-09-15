import { CCInteger, CCString, _decorator } from "cc";
import { KeyFrameEvent } from "./KeyFrameEvent";

//提供给组件 AnimationGroupComponent 的2级预设参数类, 本质上是一个VO (value object)
const { ccclass, property } = _decorator;

@ccclass('AnimPartSetter')
export class AnimPartSetter {
    /* @property({tooltip: "序列帧图片所在的分包名(非分包内的资源可留空)"})
    public bundle: string = ""; */

    @property({tooltip: "序列帧图片地址的前缀部分(非必要, 默认是''), 也就是序列数字前面的字符串, 有以下3种情况:\n1、加载的是分包内的独立图片，就要输入图片在分包下的路径前缀 例如图片'role/actions/run0001.png'要输入'role/actions/run'\n2、加载的是网络的独立图片, 就要输入图片url前缀,例如'http://www.xxx.com/role/act0on/run0001.png'要输入'http://www.xxx.com/role/action/run'\n3、加载的是图集下的子纹理(无论是远程还是本地,图集都只能通过分包加载)，就要先配置上面Using Bundle与Using Atlas List参数, 然后只要填上在纹理集内的key的数字序列前面字符串即可;\n如果key只有数字没有字符串前缀(像0001、0002之类)可以留空 "})
    public texturePrefix: string = "";

    @property({tooltip: "序列帧图片地址的后缀部分(非必要, 默认是 '.png')"})
    public textureSuffix: string = ".png";

    @property({ type: CCInteger, tooltip: "序列帧动画片段开始第一帧图片的有效自然数字(非必要, 默认为1  举例解释什么是'有效自然数': 001 的有效自然数是 1, 010 的有效自然数是 10, 100 的有效自然数是 100)\n如果你的序列帧片段动画是从'ani/attack013.png'开始播放, StartIndex就应该是 13" })
    public startIndex: number = 1;

    @property({ type: CCInteger, tooltip: "序列帧动画片段最后一帧图片的有效自然数字(必要, 而且不能小于startIndex)\n如果你的序列帧片段动画播放到'ani/attack050.png'结束, EndIndex就应该是 50" })
    public endIndex: number = -1;

    @property({ type: CCInteger, tooltip: "序列帧动画片段序列数字字符的长度(必要)\n例如'ani/attack020.png'的数字序列由'020'这三个长度的字符组成, Digits就应该是 3" })
    public digits: number = -1;

    @property({tooltip: "序列帧动画片段的名称(非必要) 设置flag之后, 就可以通过\nanim.gotoAndPlayInPart(flag, 1) 的方式让动画进入指定片段并开始播放,\n如果没有flag 你也可以通过传入动画片段序号的方式 anim.gotoAndPlayInPart(0, 1) 让动画播放指定片段" })
    public flag: string = "";

    @property({ type: [KeyFrameEvent], tooltip: "序列帧动画片段的关键帧消息通知(非必要)\n例如这是一段攻击动画的片段, 命中判定在第20帧, 需要在第20帧的位置让节点\n发送一个消息通知, 那么这个参数就适合你使用" })
    public keyFrameEventList: KeyFrameEvent[] = [];
}