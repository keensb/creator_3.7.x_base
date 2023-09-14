//这是一个独立在项目外的, 便于调试的辅助工具类, 仅用于 PC端Web页面开发版(依赖window和document),  同时提供一些常用测试API的简写, 例如$dd、$hh等    在移动端调试或发布正式版前应该删除这个类文件(直接删除即可 本文件不与其他模块存在耦合)
import { _decorator, Component, Node, assetManager, Sprite, Button, NodeEventType, Texture2D, AudioClip, AudioSource, Asset, SpriteAtlas, find, SpriteFrame, ImageAsset, CCString, CCInteger, TweenAction, Tween, tween, director, EventTouch, Graphics, Color, Rect, Vec2, Canvas, input, Input, Scene, Widget, BlockInputEvents } from 'cc';
import { EngineOverrider } from '../overwrite/EngineOverrider';
import { TimerUtils } from './TimerUtils';
import { alignMgr } from './alignMgr';




export class debugUtils { }
//编译后会打包进 ./bin/js/bundle.js    根据在  __name(RushEntry, "RushEntry")  这样的队列的位置,  从上向下的顺序执行

//下面是你想执行的脚本的入口 但是如果上面的  import "./develop/APIOverride"; 取消注释, 那么这里的代码就是多余的
(() => {
    if (!globalThis["document"]) return;
    globalThis["$dd"] = globalThis["debugDraw"] = function (rectOrPoints?: Node | Rect | Vec2[] | number[] | Vec2 | number, point2?: number) {
        if (!globalThis["debug_d"]) {
            globalThis["debug_d"] = new Node();
            globalThis["debug_d2"] = new Node();

            globalThis["debug_d"].name = "debug_PolyDrawer";
            globalThis["debug_d2"].name = "debug_LineDrawer";
        }

        let d: Node = globalThis["debug_d"];
        let d2: Node = globalThis["debug_d2"];

        d.opacity = 0.3;
        d2.opacity = 1;
        d.directGetComponent(Graphics);
        d2.directGetComponent(Graphics);

        d.getComponent(Graphics).clear();
        d2.getComponent(Graphics).clear();
        if (rectOrPoints === null || rectOrPoints === undefined) {
            if (d.parent) {
                d.parent = null;
                d2.parent = null;
            }
            globalThis["$tt"] = null;
            globalThis["$ot"] = null;
            director.getScheduler().unschedule(globalThis["$draw"], d.getComponent(Graphics));
            return false;
        }

        let canvas = director.getScene().getComponentInChildren(Canvas).node;
        canvas.addChild(d);
        canvas.addChild(d2);

        d.x = -canvas.nodeWidth / 2;
        d.y = -canvas.nodeHeight / 2;
        d2.x = -canvas.nodeWidth / 2;
        d2.y = -canvas.nodeHeight / 2;

        if (point2 === undefined && typeof rectOrPoints == "number") {
            let _nd = EngineOverrider.stageSubNodeDic[rectOrPoints];
            rectOrPoints = <Node>(_nd) || rectOrPoints;
        }

        if (!isNaN(point2) && typeof rectOrPoints == "number") {
            d.getComponent(Graphics).circle(rectOrPoints, point2, 60);
            let color = new Color(0, 0, 255);
            d.getComponent(Graphics).fillColor = color;
            d.getComponent(Graphics).fill();

            d2.getComponent(Graphics).moveTo(rectOrPoints, point2);
            d2.getComponent(Graphics).lineWidth = 3;
            d2.getComponent(Graphics).strokeColor = new Color(0, 0, 255);

            d2.getComponent(Graphics).lineTo(canvas.nodeWidth / 2, canvas.nodeHeight / 2);
            d2.getComponent(Graphics).stroke();
            //绘制一条线连接点和场景中心 当点的位置超出场景范围时,这条线可以告知点的去向
            return false;
        }

        let points = [];
        let isPoint = false;
        let isShow: boolean = true;

        if (rectOrPoints instanceof Node) {
            if (!rectOrPoints.stage) {
                console.warn("目标对象不在场景里");
                return false;
            }
            if (!rectOrPoints.gl_active || rectOrPoints.gl_opacity == 0) {
                isShow = false;
            }

            let _rectOrPoints = rectOrPoints.getGlobalBounds();
            points.push(_rectOrPoints.x, _rectOrPoints.y, _rectOrPoints.x + _rectOrPoints.width, _rectOrPoints.y, _rectOrPoints.x + _rectOrPoints.width, _rectOrPoints.y + _rectOrPoints.height, _rectOrPoints.x, _rectOrPoints.y + _rectOrPoints.height);
        }
        else if (rectOrPoints instanceof Rect) {
            points.push(rectOrPoints.x, rectOrPoints.y, rectOrPoints.x + rectOrPoints.width, rectOrPoints.y, rectOrPoints.x + rectOrPoints.width, rectOrPoints.y + rectOrPoints.height, rectOrPoints.x, rectOrPoints.y + rectOrPoints.height);
        }
        else if (rectOrPoints instanceof Array) {
            let _rectOrPoints: any = rectOrPoints;
            _rectOrPoints = _rectOrPoints.concat();

            if (_rectOrPoints.length == 2) {
                let point = new Vec2(_rectOrPoints[0], _rectOrPoints[1]);
                _rectOrPoints.length = 0;
                isPoint = true;
                _rectOrPoints.push(point.x, point.y);
            }

            for (let i = 0; i < _rectOrPoints.length; i++) {
                let item: any = _rectOrPoints[i];
                if (item instanceof Vec2) {
                    points.push(item.x, item.y);
                }
                else {
                    points.push(item);
                }
            }
        }
        else {
            let point: any = rectOrPoints;
            isPoint = true;
            points.push(point.x, point.y);
        }


        if (!isPoint) {
            //绘制多边形, 数组 奇数元素是x坐标, 偶数元素是y坐标
            let g = d.getComponent(Graphics);
            if (isShow) {

                g.lineWidth = 0;
                g.fillColor = new Color(0, 255, 0, 60);
                g.moveTo(points[0], points[1]);
                for (let i = 2; i < points.length; i += 2) {
                    g.lineTo(points[i], points[i + 1]);
                }
                g.close();
                g.stroke();
                g.fill();
            }
            else {
                g.lineWidth = 0;
                if (rectOrPoints && rectOrPoints == globalThis["$tt"] && (!globalThis["$tt"].gl_active || globalThis["$tt"].gl_opacity == 0)) {
                    g.fillColor = new Color(255, 0, 0, 60);//当前存在于舞台, 但是不可见(gl_active或gl_opacity的原因)
                }
                else {
                    g.fillColor = new Color(0, 255, 0, 60);//当前存在于舞台, 并且可见
                }
                g.moveTo(points[0], points[1]);
                for (let i = 2; i < points.length; i += 2) {
                    g.lineTo(points[i], points[i + 1]);
                }
                g.close();
                g.stroke();
                g.fill();
            }
            let left = points[0], top = points[1], right = points[0], bottom = points[1];
            for (let a = 0; a < points.length; a += 2) {
                left = Math.min(left, points[a]);
                right = Math.max(right, points[a]);
            }

            for (let b = 1; b < points.length; b += 2) {
                top = Math.min(top, points[b]);
                bottom = Math.max(bottom, points[b]);
            }

            d2.getComponent(Graphics).clear();

            d2.getComponent(Graphics).moveTo(left + (right - left) / 2, top + (bottom - top) / 2);
            d2.getComponent(Graphics).lineWidth = 3;
            d2.getComponent(Graphics).strokeColor = new Color(0, 0, 255);
            d2.getComponent(Graphics).lineTo(canvas.nodeWidth / 2, canvas.nodeHeight / 2);
            d2.getComponent(Graphics).stroke();
        }
        else {
            d.getComponent(Graphics).circle(points[0], points[1], 5);
            let color = new Color(0, 0, 255);
            d.getComponent(Graphics).fillColor = color;
            d.getComponent(Graphics).fill();

            d2.getComponent(Graphics).moveTo(points[0], points[1]);
            d2.getComponent(Graphics).lineWidth = 3;
            d2.getComponent(Graphics).strokeColor = new Color(0, 0, 255);
            d2.getComponent(Graphics).lineTo(canvas.nodeWidth / 2, canvas.nodeHeight / 2);
            d2.getComponent(Graphics).stroke();
        }


        return true;

    }
    //以下是一些简写的全局API, 仅在调试版生效


    /*    globalThis["$uh"] = UIAlign.horizontalAlign;
       globalThis["$uv"] = UIAlign.verticalAlign;
   
       globalThis["UIAlign"] = UIAlign;
       globalThis["AlginType_V"] = AlginType_V;
       globalThis["AlginType_H"] = AlginType_H;
       globalThis["AnimationGroupPlayer"] = AnimationGroupDirector; */


    globalThis["$rd"] = (rectOrPoints, point2 = undefined) => {
        globalThis["$dd"]();
        globalThis["$dd"](rectOrPoints, point2);
    }

    //绘制出交点对象的轮廓
    globalThis["$dt"] = function () {
        if (globalThis["$ot"]) {
            return globalThis["$dd"](globalThis["$ot"]);
        }
        return false;
    }












    let iskeyDown = false;
    if (globalThis.document) {//在页面上(调试版本)按下左ctrl键 对着UI点鼠标左键或右键 能获取UI节点 或 父级节点的轮廓 同时把这个节点的引用赋予全局变量$tt 你可以在控制台通过'$tt' 来直接引用它 也可以在控制台输入 $nt() 来查看 $tt 在场景上的路径
        TimerUtils.execFuncOn(
            () => { return !!director.getScene() && !!director.getScene().getComponentInChildren(Canvas) },
            () => {

                //Laya.Stat.show(0,0); //开启调试信息面板 主要用于监视帧频
                //currentScene.on(Laya.Event.KEY_DOWN, (evt) => { console.log(evt); iskeyDown = true });
                //currentScene.on(Laya.Event.KEY_UP, (evt) => { iskeyDown = false });


                //点鼠标左键 优先选中当前冒泡节点 例如左键点击List里的条目, 选中的是条目本身而不是 List节点
                function mouseDown(evt) {

                    if (!iskeyDown) return;
                    if (!evt) return;
                    if (evt.stopPropagation) evt.stopPropagation();
                    //console.log("mouseDown", evt);
                    //Laya.timer.clear(slef, draw);

                    //director.getScheduler().unschedule(globalThis["$draw"], globalThis["debug_d"].getComponent(Graphics));
                    let hitP = new Vec2(evt._prevX, evt._prevY);
                    let t: any = director.getScene();
                    let nodeList = director.getScene().getAllSubNodes();

                    if (nodeList.indexOf(globalThis["debug_block"]) >= 0) {
                        nodeList.splice(nodeList.indexOf(globalThis["debug_block"]), 1);
                    }

                    for (let key in nodeList) {
                        if (nodeList[key] instanceof Node == false) continue;
                        let k = <Node>nodeList[key];
                        if (!k.gl_active) continue;
                        if (k == globalThis["debug_d"] || k == globalThis["debug_d2"]) continue;
                        // if (k.getGlobalBounds().contains(hitP) == false) continue;//先判定轮廓碰撞
                        //if (k.hitTestPoint(evt._prevX, evt._prevY) == false) continue;//再判定像素点碰撞

                        if (!k.uiTransform.hitTest(hitP)) continue;//再判定像素点碰撞

                        if (k.contains(t)) continue;
                        if (t.contains(k)) {//先比较t是不是k的祖级节点
                            t = k;
                        }
                        else {//再比较最低节点分支下, 谁的组级节点index比较高
                            let _p: any = k.parent;
                            while (!_p.contains(t)) {
                                _p = _p.parent;
                            }

                            let _pt: any = t;
                            while (_pt.parent != _p) {
                                _pt = _pt.parent;
                            }

                            let _pk: any = k;
                            while (_pk.parent != _p) {
                                _pk = _pk.parent;
                            }

                            if (_p.children.indexOf(_pk) > _p.children.indexOf(_pt)) {
                                t = k;
                            }
                        }
                    }

                    globalThis["$tt"] = t;
                    globalThis["$ot"] = t;

                    draw();

                    globalThis["$nt"]();
                }

                //点鼠标右键 优先选中上级节点(相当于可视对象的节点) 例如右键点击List里的条目, 选中的是List节点 而不是条目本身
                /* function rightMouseDown(evt) {
                    if (evt.currentTarget == currentScene) {
                        if (!iskeyDown) {
                            globalThis["$ot"] = null;
                            //currentScene.off(Laya.Event.RIGHT_MOUSE_DOWN, currentScene, rightMouseDown);
                            globalThis["$dd"]();
                        }
                        return;
                    }
 
                } */

                // input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
                //input.on(Input.EventType.KEY_UP, this.onKeyUp, this);


                input.on(Input.EventType.KEY_DOWN, (evt) => {
                    if (iskeyDown) return;

                    if (evt.keyCode == 17 && evt.type == "keydown") {

                        if (!globalThis["debug_block"]) {
                            globalThis["debug_block"] = new Node("debug_blockInputEvents");//添加一个全屏的Node, 附带blockEvents组件, 用于阻挡鼠标点击事件
                            globalThis["debug_block"].addComponent(Widget);
                            globalThis["debug_block"].addComponent(BlockInputEvents);
                        }
                        director.getScene().getComponentInChildren(Canvas).node.addChild(globalThis["debug_block"]);
                        globalThis["debug_block"].zIndex = Number.MAX_VALUE;
                        let widget = globalThis["debug_block"].getComponent(Widget);
                        globalThis["debug_block"].nodeWidth = director.getScene().getComponentInChildren(Canvas).node.nodeWidth;
                        globalThis["debug_block"].nodeHeight = director.getScene().getComponentInChildren(Canvas).node.nodeHeight;
                        globalThis["debug_block"].x = 0;
                        globalThis["debug_block"].y = 0;
                        widget.updateAlignment();



                        console.log("开启 debug_MouseDown");
                        iskeyDown = true;



                        globalThis["debug_block"].on(NodeEventType.MOUSE_DOWN, mouseDown, this);
                        director.getScheduler().unschedule(globalThis["$draw"], director.getScene());
                        globalThis["$dd"]();

                    }
                }, this)



                input.on(Input.EventType.KEY_UP, (evt) => {
                    if (evt.keyCode == 18 && evt.type == "keyup") {
                        //console.log("关闭debugDraw");
                        globalThis["$ot"] = null;
                        globalThis["$dd"]();
                    }
                    if (!iskeyDown) return;
                    if (evt.keyCode == 17 && evt.type == "keyup") {
                        console.log("关闭 debug_MouseDown");
                        iskeyDown = false;
                        globalThis["debug_block"].off(NodeEventType.MOUSE_DOWN, mouseDown, this);
                        globalThis["debug_block"].parent = null;
                    }
                    //currentScene.on(Laya.Event.RIGHT_MOUSE_DOWN, currentScene, rightMouseDown);
                })

                function draw() {
                    let bool = globalThis["$dt"]();
                    if (!globalThis["$ot"] || !bool) {
                        director.getScheduler().unschedule(globalThis["$draw"], director.getScene());
                    }
                }

                globalThis["$draw"] = draw;
                /* currentScene.on(Laya.Event.MOUSE_DOWN, (evt) => {
                    if (!iskeyDown) return;
                    globalThis["$tt"] = null;
                    globalThis["$ot"] = null;
                    Laya.timer.clear(slef, draw);
                    globalThis["$dd"]();
                }) */

                //直接通过舞台上的Node对象的hashCode, 获得其引用
                globalThis["$hh"] = function (hashCode) {
                    return EngineOverrider.stageSubNodeDic[hashCode];
                };

            }, this);

    }

    globalThis["$nt"] = function ($tt, $open) {
        let currentScene = director.getScene();
        if ($tt !== undefined) {
            if ($tt instanceof Node) {
                globalThis["$ot"] = $tt;
            }
            else {
                if (typeof $tt == "number") {
                    if ($tt == currentScene.hashCode) {
                        $tt = currentScene;
                    }
                    else {
                        $tt = EngineOverrider.stageSubNodeDic[$tt];
                        globalThis["$ot"] = $tt;
                    }
                }
            }
        }
        else {
            $tt = globalThis["$tt"];
            globalThis["$ot"] = $tt;
        }
        if (!$tt || !$tt.stage) {
            console.log("焦点或目标对象 不在舞台上!");
            director.getScheduler().unschedule(globalThis["$draw"], director.getScene());
            return;
        }

        let t: Node = $tt;

        let parent: any = t;
        let parentList = [t];
        while (parent.parent) {
            parent = parent.parent;
            parentList.push(parent);
        }

        parentList.reverse();

        let highestParentNode;
        let lowestSubNode;// = t;
        let pathTree = "cc.director.getScene()";

        while (parentList.length > 0) {
            highestParentNode = parentList.shift();
            lowestSubNode = t;
            let isContinue = false;
            let isKey = false;
            recycling: for (let j = parentList.length - 1; j >= 0; j--) {
                for (let key in highestParentNode) {//直接通过key获取
                    if (highestParentNode[key] == parentList[j]) {
                        isKey = true;
                        pathTree = pathTree + "\x1b[33m['" + key + "']\x1b[0m";
                        parentList = parentList.slice(j, parentList.length);
                        break recycling;
                    }
                }
            }

            if (!isKey) {
                if (highestParentNode.components && highestParentNode.components.length > 0) {//跳级查找 遍历节点上挂载的脚本, 看看有没有最快捷的引用
                    recycling: for (let j = parentList.length - 1; j >= 0; j--) {
                        for (let i = 0; i < highestParentNode.components.length; i++) {
                            for (let key in highestParentNode.components[i]) {
                                if (highestParentNode.components[i][key] == parentList[j]) {
                                    parentList = parentList.slice(j, parentList.length);
                                    let className = highestParentNode.components[i].constructor.name;
                                    //if (Laya.ClassUtils.getClass(className)) {
                                    if (className) {
                                        pathTree += ".getComponent('" + className + "')\x1b[33m['" + key + "']\x1b[0m";
                                    }
                                    else {
                                        pathTree += ".components[" + i + "]" + "\x1b[33m['" + key + "']\x1b[0m";
                                    }
                                    isContinue = true;
                                    break recycling;
                                }
                            }
                        }
                    }
                }

                if (isContinue) continue;

                lowestSubNode = parentList[0];

                if (!lowestSubNode) {
                    break;
                }
                let sameName = false;
                for (let i = 0; i < highestParentNode.children.length; i++) {
                    let _name = highestParentNode.children[i].name;
                    if (_name == lowestSubNode.name && highestParentNode.children[i] != lowestSubNode) {
                        sameName = true;
                        break;
                    }
                }

                pathTree = pathTree + (((lowestSubNode.name && !sameName) ? ".getChildByName('" + lowestSubNode.name + "')" : ".children[" + highestParentNode.children.indexOf(lowestSubNode) + "]"));
            }

        }



        parentList.reverse();

        /**
            //颜色与优先级别说明  1~7 从高到低
            首先约定以下3个概念:
                正常显示--节点的自身active与各级父节点的active均为true, 同时节点的自身的opacity与各级父节点的opacity均大于0
                非正常显示--节点的自身active与各级父节点的active至少有一个是false, 或者节点的自身的opacity与各级父节点的opacity至少有一个等于0   附:active为false的非正常显示节点一般点不到, 但你可以通过在控制台输入 $nt(节点hashCode) 获得它的焦点; 
                最高级非正常显示节点--假设节点a0下面有节点a1, 节点a1下面有节点a2, 节点a2下面有节点a3,  a0和a3的active等于true, 而a1和a2的active等于false; 此时a1和a2都影响a3不能正常显示,  但是向上追溯'不能正常显示的最高级节点'是a1而不是a2, 更不是a0(a0是正常显示的) a1就在这里被称为'最高级非正常显示节点'

            
            1、亮绿色: 当前目标节点, 正常显示 
            2、桔黄色: 目标节点的各级父节点,  正常显示 
            3、浅蓝色: 目标节点下的各级子节点, 正常显示
            4、白色(当浏览器选择'暗'主题的时候)/黑色(当浏览器选择'亮'主题的时候): 正常显示的节点, 并且该节点不是目标节点(如果是目标节点则根据优先级显示为 1级的亮绿色)

            5、暗绿色: 当前目标节点, 非正常显示
            6、红色: 最高级非正常显示节点, 并且该节点不是目标节点(否则显示为 5级的暗绿色)
            7、灰色: 非正常显示的节点, 该节点不是目标节点(否则显示为 5级的暗绿色), 也不是最高级非正常显示节点(否则显示为 6级的红色), 
        */
        function findSubPath(node: Node) { //节点文字使用灰色, 表示当前节点的全局active = false
            let isGroup: boolean = false;
            if (node == globalThis["debug_d"] || node == globalThis["debug_d2"] || node == globalThis["debug_block"]) return;
            //技巧1 (nameless)  意为'没有自定义name'的节点(这里自动使用实例的类名来代替), 你无法通过 parent.getChildByName 来获得对目标的引用 ※在IDE里添加的节点都有默认的name, 没有name(除非是你故意手动删除节点name xx.name="")的节点一般不存在于开发界面的场景或预制体里, 而是通过业务代码创建出来的※
            //技巧2 '节点对象["xxxx"]' 这种动态的引用路径的出现, 一般都是Scene2D或Prefab通过'UI运行时'绑定了子节点, 直接去查看'UI运行时'绑定的脚本就可以快速定位了
            let nodeName = node.name ? node.name + "( cls = " + node.constructor.name + " )" : node["__proto__"].constructor.name + "( nameless,  cls = " + node.constructor.name + " )";
            let nodeIndex = node.parent ? node.parent.children.indexOf(node) : 0;
            if (node == currentScene) {
                if (node.children && node.children.length) {
                    isGroup = true;//开启分组;
                    if (node == t) {
                        if (!$open) {
                            if (node.gl_active && node.gl_opacity > 0) {
                                console.groupCollapsed("%cScene", 'color: #66FF00;');
                            }
                            else {
                                console.groupCollapsed("%cScene", 'color: #006600;');
                            }
                        }
                        else {
                            console.group("%cScene", 'color: #66FF00;');
                        }
                    }
                    else {
                        if (node.gl_active && node.gl_opacity > 0) {
                            console.group("%cScene", 'color: #FFCC00;');
                        }
                        else {
                            console.group("%cScene", 'color: red');
                        }
                    }
                    for (let i = 0; i < node.children.length; i++) {
                        findSubPath(<Node>node.children[i]);//遍历下去
                    }
                }
                else {
                    isGroup = false;
                    if (node == t) {
                        if (node.gl_active && node.gl_opacity > 0) {
                            console.log("%cScene", 'color: #66FF00;');
                        }
                        else {
                            console.log("%cScene", 'color: #006600;');
                        }
                    }
                }
            }
            else if (node.children && node.children.length) {//如果node有子级
                isGroup = true;//开启分组
                if (node == t) {
                    if (!$open) {
                        if (node.gl_active && node.gl_opacity > 0) {
                            console.groupCollapsed("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: #66FF00;');
                        }
                        else {
                            console.groupCollapsed("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: #006600;');
                        }
                    }
                    else {
                        if (node.gl_active && node.gl_opacity > 0) {
                            console.group("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: #66FF00;');
                        }
                        else {
                            console.group("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: #006600;');
                        }
                    }
                }
                else if (node.contains(t)) {//如果目标节点在此节点下方, 展开显示
                    if (node.gl_active && node.gl_opacity > 0) {//这个分组节点全局active可见
                        console.group("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: #FFCC00;');
                    }
                    else {
                        if ((<Node>node.parent).gl_active && (<Node>node.parent).gl_opacity > 0) {
                            console.group("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: red');
                        }
                        else {
                            console.group("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: grey');
                        }
                    }
                }
                else { //否则折叠显示
                    if (node.gl_active && node.gl_opacity > 0) {//这个分组节点全局active可见
                        if (t.contains(node)) {//如果是目标的子孙级节点
                            console.groupCollapsed("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: #00CCFF;');//蓝色高亮
                        }
                        else {
                            console.groupCollapsed(nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )");
                        }
                    }
                    else {
                        if ((<Node>node.parent).gl_active && (<Node>node.parent).gl_opacity > 0) {
                            console.groupCollapsed("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: red;');//置灰显示
                        }
                        else {
                            console.groupCollapsed("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: grey;');//置灰显示
                        }
                    }
                }
                for (let i = 0; i < node.children.length; i++) {
                    findSubPath(<Node>node.children[i]);//遍历下去
                }
            }
            else {//如果node没有子级
                isGroup = false;//不开启分组

                if (node == t) {
                    if (node.gl_active && node.gl_opacity > 0) {
                        console.log("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: #66FF00;');
                    }
                    else {
                        console.log("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: #006600;');
                    }
                }
                else if (node.gl_active && node.gl_opacity > 0) {//这个分组节点全局active可见
                    if (t.contains(node)) {//如果是目标的子孙级节点
                        console.log("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: #00CCFF;');//蓝色高亮
                    }
                    else {
                        console.log(nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )");
                    }
                }
                else {
                    if (!node.active || node.gl_opacity <= 0) {//因自身不可见
                        console.log("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: red;');
                    }
                    else {
                        console.log("%c" + nodeName + "    ( index = " + nodeIndex + "   hashCode = " + node.hashCode + " )", 'color: grey;');//置灰显示
                    }
                }
            }
            if (isGroup) {//是否开启了分组显示, 是的话要在末尾处结束分组
                console.groupEnd();
            }
        }

        console.clear();

        findSubPath(currentScene)

        //cc.director.getScene().getChildByName('Canvas').children[8].getChildByName('Label')
        let arr = pathTree.split(".");
        arr.shift();
        arr.shift();
        arr.shift();//getChildByName('Canvas') , children[8], getChildByName('Label')
        let _pathTree;
        let findArr = [];
        while (arr[0] && arr[0].indexOf("getChildByName('") >= 0) {
            let str = arr.shift();
            findArr.push(str.split("'")[1]);
        }

        if (findArr.length > 0) {
            _pathTree = "cc.find('" + findArr.join("/") + "')";
            if (arr.length) {
                _pathTree = _pathTree + "." + arr.join(".")
            }
            pathTree = _pathTree;
            //console.log("_pathTree =", _pathTree);
        }

        console.log("\n从\x1b[32mScene\x1b[0m到\x1b[32m目标对象\x1b[0m(已被保存为全局变量\x1b[32m$tt\x1b[0m)的最快捷引用路径:\n\x1b[32m" + pathTree + '\x1b[0m');//从stage到目标节点的获取方式, 优先使用getChildByName; 如果是nameless的节点则使用children[xx]

        //console.log(nodeTree);
        //其实可以通过以方式实现
        /*
        console.group('分组1');//默认展开的
            console.log('语文');
            console.log('数学');
            console.groupCollapsed('其他科目');//默认折叠的
                console.log('化学');
                console.log('地理');
                console.log('历史');
            console.groupEnd();//结束
        console.groupCollapsed();
        */

        //$tt.__proto__.constructor.name
        globalThis["$dd"](globalThis["$ot"]);

        director.getScheduler().unschedule(globalThis["$draw"], director.getScene());
        director.getScheduler().schedule(globalThis["$draw"], director.getScene(), 1 / 60);

        globalThis["$draw"]();

        return globalThis["$ot"];
    }

    //$pp函数 主要是通过递归快速查找目标节点的引用路径, 还可以反射出哪个父节点的脚本类持有目标节点的引用
    //$pp(node引用或node的hashCode) 将获得该 从Scene到该node的最快捷引用路径 
    //$pp(node1引用或node1的hashCode, node2引用或node2的hashCode) 将获得该 从node1到node2的最快捷引用路径
    globalThis["$pp"] = function (topOrTarget, target) {
        if (typeof topOrTarget == "number") {
            topOrTarget = EngineOverrider.stageSubNodeDic[topOrTarget];
        }

        if (topOrTarget != null && target === undefined) {
            target = topOrTarget;
            topOrTarget = director.getScene();
        }

        if (typeof target == "number") {
            target = EngineOverrider.stageSubNodeDic[target];
        }

        if (target == topOrTarget || !topOrTarget.contains(target)) {//提供的上级节点, 不包括目标节点, 或在目标节点的下方
            return;
        }

        let parent: any = target;
        let parentList = [target];
        while (parent.parent && parent != topOrTarget) {
            parent = parent.parent;
            parentList.push(parent);
        }

        parentList.reverse();

        let highestParentNode;
        let lowestSubNode;// = t;

        let pathTree = topOrTarget == director.getScene() ? "%ccc.director.getScene()" : "$hh(" + topOrTarget.hashCode + ")%c";

        while (parentList.length > 0) {
            highestParentNode = parentList.shift();
            lowestSubNode = topOrTarget;
            let isContinue = false;
            let isKey = false;
            recycling: for (let j = parentList.length - 1; j >= 0; j--) {
                for (let key in highestParentNode) {//直接通过key获取
                    if (highestParentNode[key] == parentList[j]) {
                        isKey = true;
                        pathTree = pathTree + "['" + key + "']";
                        parentList = parentList.slice(j, parentList.length);
                        break recycling;
                    }
                }
            }

            if (!isKey) {
                if (highestParentNode.components && highestParentNode.components.length > 0) {//跳级查找 遍历节点上挂载的脚本, 看看有没有最快捷的引用
                    recycling: for (let j = parentList.length - 1; j >= 0; j--) {
                        for (let i = 0; i < highestParentNode.components.length; i++) {
                            for (let key in highestParentNode.components[i]) {
                                if (highestParentNode.components[i][key] == parentList[j]) {
                                    parentList = parentList.slice(j, parentList.length);
                                    let className = highestParentNode.components[i].constructor.name;
                                    if (className) {
                                        pathTree += ".getComponent('" + className + "')['" + key + "']";
                                    }
                                    else {
                                        pathTree += ".components[" + i + "]" + "['" + key + "']";
                                    }
                                    isContinue = true;
                                    break recycling;
                                }
                            }
                        }
                    }
                }

                if (isContinue) continue;
                lowestSubNode = parentList[0];
                if (!lowestSubNode) {
                    break;
                }
                let sameName = false;
                for (let i = 0; i < highestParentNode.children.length; i++) {
                    let _name = highestParentNode.children[i].name;
                    if (_name == lowestSubNode.name && highestParentNode.children[i] != lowestSubNode) {
                        sameName = true;
                        break;
                    }
                }

                pathTree = pathTree + (((lowestSubNode.name && !sameName) ? ".getChildByName('" + lowestSubNode.name + "')" : ".children[" + highestParentNode.children.indexOf(lowestSubNode) + "]"));
            }

        }

         //cc.director.getScene().getChildByName('Canvas').children[8].getChildByName('Label')
         let arr = pathTree.split(".");
         arr.shift();
         arr.shift();
         arr.shift();//getChildByName('Canvas') , children[8], getChildByName('Label')
         let _pathTree;
         let findArr = [];
         while (arr[0] && arr[0].indexOf("getChildByName('") >= 0) {
             console.log("arr =", arr);
             let str = arr.shift();
             findArr.push(str.split("'")[1]);
         }

         if (findArr.length > 0) {
             _pathTree = "cc.find('" + findArr.join("/") + "')";
             if (arr.length) {
                 _pathTree = _pathTree + "." + arr.join(".")
             }
             pathTree = "%c" + _pathTree;
             //console.log("_pathTree =", _pathTree);
         }

        console.log(pathTree, 'color: #00ff00;');
    }


})();
