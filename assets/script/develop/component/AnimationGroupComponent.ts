import { _decorator, CCString, Component, SpriteAtlas, SpriteFrame, Node, Sprite } from 'cc';
import { AnimationGroup, TextureInfoMaker } from '../anim/AnimationGroup';
import { AnimPartSetter } from '../anim/AnimPartSetter';
import { asyncAsset } from '../mgr/asyncAsset';
import { KeyFrameEvent } from '../anim/KeyFrameEvent';
import { DEBUG } from 'cc/env';
const { ccclass, property } = _decorator;

@ccclass('AnimationGroupComponent')
export class AnimationGroupComponent extends Component {
    /*     @property({ tooltip: "当远程加载本动画资源时, 使用指定的域名(在 src/develop/hostConfig/host.ts 文件里配置了一个指定域名地址, 可根据项目需求自行修改), 指定的域名会自动尝试与下面配置的图集地址、序列帧图片地址拼接" })
        public useCustomHost: Boolean = false; */

    @property({ tooltip: "本动画所需纹理加载完成之前, 先隐藏本节点(避免在场景中显示出一个'未知图片'的logo)" })
    public hideOnLoading: boolean = true;

    @property({ tooltip: "本动画片段组件所属的分包名(非必要, 如果加载的是'http://'格式的网络图片, 此处可留空)" })
    public usingBundle: string = ""

    @property({ type: [CCString], tooltip: "所依赖的全部图集在分包下的路径列表(非必要 须先通过路径加载图集, 才能使用其下的子纹理; \n如果加载的是'http://'格式的网络图片话可以忽略此项)\n格式不带 分包名 和 '.plist' 例如 分包名为'atlas', 图集路径为'atlas/role/actions.plist', 填入'role/actions'即可  \n另外本组件的纹理来源, 要么全都是来自图集, 要么全都是来自独立图片\n不支持'一部分来自图集, 而另一部分来自独立图片'的混合方式" })
    public usingAtlasPathList: string[] = [];

    @property({ type: [AnimPartSetter], tooltip: "序列帧动画片段设置器列表, 对应动画分组信息(必要)" })
    public animPartSetterList: AnimPartSetter[] = [];

    @property({ tooltip: "序列帧动画片段的帧频(非必要, 默认60帧/秒)" })
    public fps: number = 60;

    @property({ tooltip: "初始在第几(注意这是数组的下标)组动画开始播放,也可以是在AnimPartSetter自定义的Flag 非必要, 默认值为'0', \n当提供的预设数值无效时, 自动使用默认值'0'" })
    public startPartIndexOrFlag: String = "0";

    @property({ tooltip: "是否开启循环播放模式, 如果选择false, 动画将在片段的最后一帧停止" })
    public loopEnabled: boolean = true;

    private $anim: AnimationGroup;

    private sourceObject: { [key: number | string]: SpriteFrame } = {};

    private originl_opacity: number;

    /**
     * 第一次执行update之前执行，只会执行一次
     */
    async start(): Promise<void> {
        this.originl_opacity = this.node.opacity;
        if (this.hideOnLoading) {
            this.node.opacity = 0;
        }

        if (!this.$anim) {
            this.$anim = new AnimationGroup(this.node);
        }

        let imgList = [];


        for (let i = 0; i < this.animPartSetterList.length; i++) {
            if (!this.animPartSetterList[i].texturePrefix) {
                //console.error("无效的地址前缀 texturePrefix");
            }
            if (!this.animPartSetterList[i].textureSuffix) {
                this.animPartSetterList[i].textureSuffix = ".png"
                //console.error("无效的地址后缀 textureSuffix");
            }
            if (this.animPartSetterList[i].startIndex < 0) {
                console.error("无效的起始位置 startIndex");
            }
            if (this.animPartSetterList[i].endIndex < 0) {
                console.error("无效的结束位置 endIndex");
            }
            else if (this.animPartSetterList[i].endIndex < this.animPartSetterList[i].startIndex) {
                console.error("序列帧动画结束位置 endIndex 不能小于起始位置 startIndex");
            }
            if (this.animPartSetterList[i].digits < 0) {
                console.error("无效的序列长度 digits");
            }

            let checkFlag: boolean = true;
            if (!isNaN(Number(this.startPartIndexOrFlag))) {
                if (Number(this.startPartIndexOrFlag) > this.animPartSetterList.length - 1) {
                    console.warn("预设的startPartIndexOrFlag: '" + this.startPartIndexOrFlag + "' 超出片段列表的最大下标, 自动使用默认值 '0'");
                    this.startPartIndexOrFlag = '0';
                    checkFlag = true;
                }
                else {
                    checkFlag = true;
                }
            }
            else {
                checkFlag = false;
            }


            for (let s = this.animPartSetterList[i].startIndex; s <= this.animPartSetterList[i].endIndex; s++) {
                let seq = s.toString();

                while (seq.length < this.animPartSetterList[i].digits) {
                    seq = 0 + seq;
                }

                let textureSuffix = this.animPartSetterList[i].textureSuffix;
                if (textureSuffix == "") {
                    textureSuffix = ".png";
                }

                imgList.push(this.animPartSetterList[i].texturePrefix + seq + textureSuffix);

                if (!checkFlag && isNaN(Number(this.startPartIndexOrFlag))) {
                    if (this.animPartSetterList[i].flag == this.startPartIndexOrFlag) {
                        checkFlag = true;
                    }
                }
            }

            if (!checkFlag) {
                console.warn("预设的startPartIndexOrFlag: '" + this.startPartIndexOrFlag + "' 不匹配动画片段列表中任何Flag, 自动使用默认值 '0'");
                this.startPartIndexOrFlag = '0';
            }
        }


        if (this.usingBundle && this.usingBundle != "") {
            let bundle = await asyncAsset.loadOneBundle(this.usingBundle);//首先加载依赖的分包 
            if (!bundle) {
                console.warn("分包 " + this.usingBundle + " 不存在!");
                return;
            }
            else {
                //console.log("分包 " + this.usingBundle + " 加载成功");
            }
        }

        let _self = this;
        let atlas_loaded = false;
        let img_loaded = false;

        let loadedCount = 0;
        if (_self.usingAtlasPathList && _self.usingAtlasPathList.length > 0) {//有图集
            for (let i = 0; i < _self.usingAtlasPathList.length; i++) {
                let _path = _self.usingAtlasPathList[i];
                if (_path.substring(_path.length - 6, _path.length) == ".plist") {
                    _path = _path.substring(0, _path.length - 6);
                }
                //assetManager.getBundle(this.usingBundle).load(this.usingAtlasPathList[i], SpriteAtlas, (err, res:SpriteAtlas) => {
                asyncAsset.bundleLoadOneAsset(_self.usingBundle, _path, SpriteAtlas, (res: SpriteAtlas) => {
                    loadedCount++;
                    if (res) {
                        for (let key in res.spriteFrames) {//子纹理在图集上的key, 不带格式后缀
                            _self.sourceObject[key + ".png"] = res.spriteFrames[key];
                        }
                        _self.node.directGetComponent(Sprite).spriteFrame = res.spriteFrames[0];
                    }
                    else {
                        console.warn("分包 " + _self.usingBundle + " 不存在图集 " + _path);
                    }
                    if (loadedCount == _self.usingAtlasPathList.length) {
                        atlas_loaded = true;
                        _self.create();
                    }
                })
            }
        }
        else {
            atlas_loaded = true;
            if (img_loaded) {
                _self.create();
            }
        }

        if (imgList.length > 0) {
            if (!_self.usingAtlasPathList || !_self.usingAtlasPathList.length) {//没有图集, 全都是图片
                for (let i = 0; i < imgList.length; i++) {
                    if (imgList[i].indexOf("://") == -1) {
                        asyncAsset.bundleLoadOneAsset(_self.usingBundle, imgList[i], SpriteFrame, (res) => {
                            loadedCount++;
                            _self.sourceObject[imgList[i]] = res;
                            _self.node.directGetComponent(Sprite).spriteFrame = res;
                            if (loadedCount == imgList.length) {
                                img_loaded = true;
                                if (atlas_loaded) {
                                    _self.create();
                                }
                            }

                        })
                    }
                    else {
                        asyncAsset.loadOneRemoteSpriteFrame(imgList[i], (res) => {//网络图片
                            loadedCount++;
                            _self.sourceObject[imgList[i]] = res;
                            _self.node.directGetComponent(Sprite).spriteFrame = res;
                            if (loadedCount == imgList.length) {
                                img_loaded = true;
                                if (atlas_loaded) {
                                    _self.create();
                                }
                            }
                        })
                    }
                }
            }
            else {
                if (atlas_loaded) {
                    _self.create();
                }
            }
        }
        else {
            img_loaded = true;
            if (atlas_loaded) {
                _self.create();
            }
        }
    }

    get animationGroup(): AnimationGroup {
        return this.$anim;
    }

    private create(): void {

        //  let ani = new AnimationGroup(find("Canvas/sprite"), [info0, info1, info2, info3, info4], 1, true, asyncAsset.remoteSpriteFrameCache)

        //纹理有可能尚未被加载, 不能正常显示 需要异步处理一下
        this.node.opacity = this.originl_opacity;
        let infoList = [];
        let eventList: KeyFrameEvent[][] = [];
        for (let i = 0; i < this.animPartSetterList.length; i++) {
            let info = TextureInfoMaker.createInfoStart2End(this.animPartSetterList[i].texturePrefix, this.animPartSetterList[i].textureSuffix, this.animPartSetterList[i].startIndex, this.animPartSetterList[i].endIndex, this.animPartSetterList[i].digits, this.animPartSetterList[i].flag, { cx: this.node.uiTransform.anchorX, cy: this.node.uiTransform.anchorY });
            infoList.push(info);
            eventList.push(this.animPartSetterList[i].keyFrameEventList);
        }
        if (!this.$anim) {
            this.$anim = new AnimationGroup(this.node, infoList, 1, true, this.sourceObject);
        }
        else {
            this.$anim.textureSource = this.sourceObject;
            this.$anim.reconstruct(infoList, 1);
        }

        this.$anim.loopEnabled = this.loopEnabled;
        this.$anim.frameInterval = 1 / this.fps;
        let flag: any = this.startPartIndexOrFlag || "0";
        if (!isNaN(Number(flag))) {
            flag = Number(flag);
            if (flag < 0) {
                flag = 0;
            }
        }

        for (let a = 0; a < eventList.length; a++) {
            if (eventList[a]) {
                for (let b = 0; b < eventList[a].length; b++) {
                    if (eventList[a][b].eventType) {
                        this.$anim.addFrameScriptInPart(a, eventList[a][b].frameIndex, () => {
                            let dispatcher: Node = eventList[a][b].dispatcher || this.node;
                            dispatcher.emit(eventList[a][b].eventType, eventList[a][b].data);
                        });
                    }
                }
            }
        }

        this.$anim.gotoAndPlayInPart(flag, 1);

    }

    onDestroy(): void {
        if (this.$anim) {
            this.$anim.destroy();
        }
        this.$anim = null;
        this.sourceObject = null;
    }

    public get anim(): AnimationGroup {
        return this.$anim;
    }
}
if (DEBUG) {
    window["AnimationGroupComponent"] = AnimationGroupComponent;
}