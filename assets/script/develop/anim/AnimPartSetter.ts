import { CCInteger, CCString, _decorator } from "cc";
import { KeyFrameEvent } from "./KeyFrameEvent";

//提供给组件 AnimationGroupComponent 的2级预设参数类, 本质上是一个VO (value object)
const { ccclass, property } = _decorator;

@ccclass('AnimPartSetter')
export class AnimPartSetter {
    /* @property({tooltip: "序列帧图片所在的分包名(非分包内的资源可留空)"})
    public bundle: string = ""; */

    @property({tooltip: "序列帧图片地址的前缀部分(必要), 也就是序列数字前面的字符串, 有以下3种情况:\n1、加载的是分包内的独立图片，就要输入图片在分包下的路径前缀 例如图片'role/actions/run0001.png'要输入'role/actions/run'\n2、加载的是网络的独立图片, 就要输入图片url前缀,例如'http://www.xxx.com/role/acton/run'要输入'http://www.xxx.com/role/acton/run'\n3、加载的是图集下的子纹理(无论是远程还是本地,图集都只能通过分包加载)，就要先配置上面Using Bundle与Using Atlas List参数, 然后只要填上在纹理集内的key即可 "})
    public texturePrefix: string = "";

    @property({tooltip: "序列帧图片地址的后缀部分(非必要, 默认是 '.png')"})
    public textureSuffix: string = ".png";

    @property({ type: CCInteger, tooltip: "序列帧动画片段开始第一帧图片的数字(非必要, 默认为1)\n如果你的序列帧片段动画是从'ani/attack013.png'开始播放, StartIndex就应该是 13" })
    public startIndex: number = 1;

    @property({ type: CCInteger, tooltip: "序列帧动画片段最后一帧图片的数字(必要, 而且不能小于startIndex)\n如果你的序列帧片段动画播放到'ani/attack050.png'结束, EndIndex就应该是 50" })
    public endIndex: number = -1;

    @property({ type: CCInteger, tooltip: "序列帧动画片段列数字字符的长度(必要)\n例如'ani/attack020.png'的数字序列由'020'这三个长度的字符组成, Digits就应该是 3" })
    public digits: number = -1;

    @property({tooltip: "序列帧动画片段的名称(非必要)" })
    public flag: string = "";

    @property({ type: [KeyFrameEvent], tooltip: "序列帧动画片段的关键帧消息通知(非必要)\n例如这是一段攻击动画的片段, 命中判定在第20帧, 需要在20帧的位置让本组件的节点\n(※注意消息派发者是this.node)发送一个消息出来, 那么这个选项就适合你使用" })
    public keyFrameEventList: KeyFrameEvent[];
}