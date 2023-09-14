import { Layout, Node, Widget, screen, UITransform, v3, Canvas, find, view, director, assetManager, Rect } from "cc";
import { DEBUG } from "cc/env";

export enum alignType {
    LEFT_TO_LEFT = 2,
    LEFT_TO_RIGHT = 4,
    RIGHT_TO_RIGHT = 8,
    RIGHT_TO_LEFT = 16,
    TOP_TO_TOP = 32,
    TOP_TO_BOTTOM = 64,
    BOTTOM_TO_BOTTOM = 128,
    BOTTOM_TO_TOP = 256,
    CENTER_TO_CENTER = 512,
    MIDDLE_TO_MIDDLE = 1024,
    H_CENTER_TO_CENTER = 2048,
    V_CENTER_TO_CENTER = 4096
}


export class alignMgr {

    public static browserInfo = {
        userAgent: navigator.userAgent.toLowerCase(),
        isAndroid: Boolean(navigator.userAgent.match(/android/ig)),
        isIphone: Boolean(navigator.userAgent.match(/iphone|ipod/ig)),
        isIpad: Boolean(navigator.userAgent.match(/ipad/ig)),
        isWeixin: Boolean(navigator.userAgent.match(/MicroMessenger/ig)),
    }

    /**
     * 让某个节点自适其节点下的内容， 并获取当前真实宽高(注意：该节点必须是没有挂载 layout的节点,并且其子节点都没有挂载 widget)
     */
    public static nodeResideByContainer(node: Node): void {
        //node.getBoundingBoxToWorld() //可以获取其真实宽高
        if (node.getComponent(Layout)) {
            console.info("该节点已经挂载Layout");
            return;
        }
        let childrenCount = node.children.length
        for (let i = 0; i < childrenCount; i++) {
            if (node.children[i].getComponent(Widget)) {
                console.info("该节点的子节点已经挂载Widget");
                return;
            }
        }

        let layout = node.addComponent(Layout);
        layout.type = Layout.Type.NONE;
        layout.resizeMode = Layout.ResizeMode.CONTAINER;
        layout.updateLayout();

        layout.destroy();
    }




    /**
     * 获得某个目标节点  可以完整的出现在场景内 的最大缩放比例  overAble 的意思是否运行返回大于 1 的比例
     */
    public static nodeAutoFitSize(targetNode: Node, overAble: boolean = false): number {
        let width = alignMgr.getGlobalRight(targetNode) - alignMgr.getGlobalLeft(targetNode);
        let height = alignMgr.getGlobalTop(targetNode) - alignMgr.getGlobalBottom(targetNode);


        let scale = Math.max(width / screen.windowSize.width, height / screen.windowSize.height);
        if (!overAble && scale > 1) return 1;
        return scale;
    }

    /**
     * 获得某个目标节点  可以完整的出现在设备屏幕内 的最大缩放比例  overAble 的意思是否运行返回大于 1 的比例
     */
    public static nodeAutoFitFrameSize(targetNode: Node, overAble: boolean = false): number {
        let width = alignMgr.getGlobalRight(targetNode) - alignMgr.getGlobalLeft(targetNode);
        let height = alignMgr.getGlobalTop(targetNode) - alignMgr.getGlobalBottom(targetNode);

        let scale = Math.max(width / screen.windowSize.width, height / screen.windowSize.height);
        if (!overAble && scale > 1) return 1;
        return scale;
    }



    /**
     * 把同一节点下的若干 子节点从左到右 平均间隔排列  前提条件是所有子节点必须有真实宽度(如果该节点下面有其他子节点，请用临时的layout来约束其真实宽高，然后删除该layout)
     * 注意:这个方法可能不会同步展现效果(受widget组件的影响)，最好通过一个延时0.01秒的方法来执行
     * @param nodes 节点数组， 数组第一个节点必须在最左侧，数组最后一个节点必须在最右侧 该方法不会改变第一个节点和最后一个节点的位置
     */
    public static nodesAlingHorizontal(nodes: Node[]): void {
        let len = nodes.length;
        if (len < 3) return;//至少需要3个或3个以上的节点， 平均间隔才有意义
        let left = nodes[0].x - nodes[0].nodeWidth * nodes[0].scaleX * nodes[0].uiTransform.anchorX;
        let right = nodes[len - 1].x + nodes[len - 1].nodeWidth * nodes[len - 1].scaleX * (1 - nodes[len - 1].uiTransform.anchorX);

        let totalWidth = 0;

        for (let i = 0; i < nodes.length; i++) {
            totalWidth += nodes[i].nodeWidth * nodes[i].scaleX;
        }

        let spacing = (right - left - totalWidth) / (len - 1);

        for (let i = 1; i < len - 1; i++) {
            let curr = nodes[i];
            let prev = nodes[i - 1];
            curr.x = prev.x + prev.nodeWidth * prev.scaleX * (1 - prev.uiTransform.anchorX) + curr.nodeWidth * curr.scaleX * curr.uiTransform.anchorX + spacing;
        }

    }

    /**
     * 把同一节点下的若干 子节点从上到下 平均间隔排列  前提条件是所有子节点必须有真实高度(如果该节点下面有其他子节点，请用临时的layout来约束其真实宽高，然后删除该layout)
     * 注意:这个方法可能不会同步展现效果(受widget组件的影响)，最好通过一个延时0.01秒的方法来执行
     * @param nodes 节点数组， 数组第一个节点必须在最顶端，数组最后一个节点必须在最底端 该方法不会改变第一个节点和最后一个节点的位置
     */
    public static nodesAlingVertical(nodes: Node[]): void {
        let len = nodes.length;
        if (len < 3) return;//至少需要3个或3个以上的节点， 平均间隔才有意义
        let top = nodes[0].y + nodes[0].nodeHeight * nodes[0].scaleY * (1 - nodes[0].uiTransform.anchorY);
        let bottom = nodes[len - 1].y - nodes[len - 1].nodeHeight * nodes[len - 1].scaleY * nodes[len - 1].uiTransform.anchorY;

        let totalHeight = 0;
        for (let i = 0; i < nodes.length; i++) {
            totalHeight += nodes[i].nodeHeight * nodes[i].scaleY;
        }

        let spacing = (top - bottom - totalHeight) / (len - 1);

        for (let i = 1; i < len - 1; i++) {

            let curr = nodes[i];
            let prev = nodes[i - 1];

            curr.y = prev.y - prev.nodeHeight * prev.scaleY * prev.uiTransform.anchorY - curr.nodeHeight * curr.scaleY * (1 - curr.uiTransform.anchorY) - spacing;
        }
    }



    public static getGlobalTop(node: Node): number {
        if (!node || !node.parent) return NaN;
        let scaleY = node.scaleY;
        let parent = node.parent;
        while (parent) {
            scaleY *= parent.scaleY;
            parent = parent.parent;
        }
        return node.parent.uiTransform.convertToWorldSpaceAR(v3(node.x, node.y)).y + node.nodeHeight * scaleY * (1 - node.uiTransform.anchorY);
    }

    public static getGlobalBottom(node: Node): number {
        if (!node || !node.parent) return NaN;
        let scaleY = node.scaleY;
        let parent = node.parent;
        while (parent) {
            scaleY *= parent.scaleY;
            parent = parent.parent;
        }
        return node.parent.uiTransform.convertToWorldSpaceAR(v3(node.x, node.y)).y - node.nodeHeight * node.scaleY * node.uiTransform.anchorY;
    }

    public static getGlobalLeft(node: Node): number {
        if (!node || !node.parent) return NaN;
        let scaleX = node.scaleX;
        let parent = node.parent;
        while (parent) {
            scaleX *= parent.scaleX;
            parent = parent.parent;
        }
        return node.parent.uiTransform.convertToWorldSpaceAR(v3(node.x, node.y)).x - node.nodeWidth * scaleX * node.uiTransform.anchorX;
    }

    public static getGlobalRight(node: Node): number {
        if (!node || !node.parent) return NaN;
        let scaleX = node.scaleX;
        let parent = node.parent;
        while (parent) {
            scaleX *= parent.scaleX;
            parent = parent.parent;
        }
        return node.parent.uiTransform.convertToWorldSpaceAR(v3(node.x, node.y)).x + node.nodeWidth * scaleX * (1 - node.uiTransform.anchorX);
    }


    /**
     * 让节点1的左侧边缘主动贴近节点2的左侧边缘处(左对齐), (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static leftToLeft(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;
        let left1 = n1w.x;
        let left2 = n2w.x || n2w;

        let scaleX = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.x) {
                scaleX *= parent.scale.x;
                parent = parent.parent;
            }
        }
        node1.x += (left2 - left1) / scaleX;
    }


    /**
     * 让节点1的左侧边缘主动贴近节点2的右侧边缘处(接合), (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static leftToRight(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;
        let left = n1w.x;
        let right = n2w.x + n2w.width || n2w;

        let scaleX = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.x) {
                scaleX *= parent.scale.x;
                parent = parent.parent;
            }
        }
        node1.x += (right - left) / scaleX;
    }

    /**
     * 让节点1的右侧边缘主动贴近节点2的右侧边缘处(右对齐), (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static rightToRight(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;
        let right1 = n1w.x + n1w.width;
        let right2 = n2w.x + n2w.width || n2w;

        let scaleX = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.x) {
                scaleX *= parent.scale.x;
                parent = parent.parent;
            }
        }
        node1.x += (right2 - right1) / scaleX;
    }

    /**
     * 让节点1的右侧边缘主动贴近节点2的左侧边缘处(接合), (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static rightToLeft(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;
        let left = n2w.x;
        let right = n1w.x + n1w.width || n2w;

        let scaleX = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.x) {
                scaleX *= parent.scale.x;
                parent = parent.parent;
            }
        }
        node1.x += (left - right) / scaleX;
    }

    /**
     * 让节点1的水平中心与节点2的水平中心重合, (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static hCenterToCenter(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        alignMgr.leftToLeft(node1, refObj, getParentWorldScale);
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;


        let center1 = n1w.x + n1w.width / 2;
        let center2 = n2w.x + n2w.width / 2 || n2w;

        let scaleX = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.x) {
                scaleX *= parent.scale.x;
                parent = parent.parent;
            }
        }

        node1.x += (center2 - center1) / scaleX;
    }

    /**
     * 让节点1的水平中心与节点2的水平中心重合, (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static vCenterToCenter(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        alignMgr.bottomToBottom(node1, refObj, getParentWorldScale);
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;

        let center1 = n1w.y + n1w.height / 2;
        let center2 = n2w.y + n2w.height / 2 || n2w;

        let scaleY = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.y) {
                if (parent == refObj) {
                    console.info("无法对齐! 因为节点1是节点2的父级")
                }
                scaleY *= parent.scale.y;
                parent = parent.parent;
            }
        }

        node1.y += (center2 - center1) / scaleY;
    }

    /**
     * 让节点1的顶端边缘主动贴近节点2的顶端边缘处(顶对齐), (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static topToTop(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;
        let top1 = n1w.y + n1w.height;
        let top2 = n2w.y + n2w.height || n2w;

        let scaleY = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.y) {
                scaleY *= parent.scale.y;
                parent = parent.parent;
            }
        }
        node1.y += (top2 - top1) / scaleY;
    }

    /**
     * 让节点1的顶端边缘主动贴近节点2的底端边缘处(接合), (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static topToBottom(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;
        let top = n1w.y + n1w.height;
        let bottom = n2w.y || n2w;

        let scaleY = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.y) {
                scaleY *= parent.scale.y;
                parent = parent.parent;
            }
        }

        node1.y += (bottom - top) / scaleY;
    }

    /**
     * 让节点1的底端边缘主动贴近节点2的底端边缘处(底对齐), (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static bottomToBottom(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;
        let bottom1 = n1w.y;
        let bottom2 = n2w.y || n2w;

        let scaleY = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.y) {
                scaleY *= parent.scale.y;
                parent = parent.parent;
            }
        }

        node1.y += (bottom2 - bottom1) / scaleY;
    }

    /**
     * 让节点1的底端边缘主动贴近节点2的顶端边缘处(接合), (节点1不能是节点2的父级节点  因为父级无法向子级对齐(父级移动子级也会跟着移动) 并且节点1没有被 Widget 所约束)
     * 第三个参数的意思是启用递归scale判断
     */
    public static bottomToTop(node1: Node, refObj: Node | Rect | number, getParentWorldScale = true): void {
        let n1w = node1.getGlobalBounds();
        let n2w: any = refObj instanceof Node ? refObj.getGlobalBounds() : refObj;
        let bottom = n1w.y;
        let top = n2w.y + n2w.height || n2w;

        let scaleY = 1;
        if (getParentWorldScale) {
            let parent = node1.parent;
            while (parent && parent.scale.y) {
                scaleY *= parent.scale.y;
                parent = parent.parent;
            }
        }

        node1.y += (top - bottom) / scaleY;
    }


    /**
     * 让子节点贴在父级节点边缘(任意机型, 任意宽高, fitHight或fitWidth均同用)的方法
     * /
     /*
        let newNode = new Node();
     
    
        let win_bl1 = screen.windowSize.width / screen.windowSize.height;//设计分辨率比例
        let sb_bl1 = screen.windowSize.width / screen.windowSize.height;//设备屏幕比例
    
        let win_bl2 = screen.windowSize.height / screen.windowSize.width;//设计分辨率比例
        let sb_bl2 = screen.windowSize.height / screen.windowSize.width;//设备屏幕比例 
    
    
        let newNode = new Node();
        newNode.parent = Canvas.instance.node;
    
     
    
        //一般手机  fitHight || fitWidth  横屏 
        //newNode.setContentSize(screen.windowSize.width * sb_bl1 / win_bl1, screen.windowSize.height);
    
        //一般手机  fitHight || fitWidth  竖屏   或    ipad  fitHight || fitWidth  横屏竖屏通用
        //newNode.setContentSize(screen.windowSize.width , screen.windowSize.height * sb_bl2 / win_bl2);
    
        //智能识别
        if (screen.windowSize.width / screen.windowSize.height > 1.4) {//手机横屏
            newNode.setContentSize(screen.windowSize.width * sb_bl1 / win_bl1, screen.windowSize.height);
        }
        else {//手机竖屏 或 ipad 横屏or竖屏
            newNode.setContentSize(screen.windowSize.width, screen.windowSize.height * sb_bl2 / win_bl2);
        }
    
    
        topToTop(targetNode, newNode);//顶部对齐
        leftToLeft(targetNode, newNode);//左侧对齐
    
        targetNode.x += 20;//修正偏移x
        targetNode.y -= 10;//修正偏移y
    
        newNode.destroy();
     */

    /**
     * 获得设备当前屏幕上显示的宽高(有时候iPad竖屏屏幕高度为 1024 但显示高度只有853)
     */
    public static getShowingFrameSize(): { width: number, height: number } {
        let win_bl1 = screen.windowSize.width / screen.windowSize.height;//设计分辨率比例
        let win_bl2 = screen.windowSize.height / screen.windowSize.width;//设计分辨率比例

        //智能识别
        if (screen.windowSize.width > screen.windowSize.height) {//这个项目是以横屏为主设计的
            //console.log("横屏逻辑设计")
            if (screen.windowSize.width / screen.windowSize.height > 1.4) {//手机横屏摆放
                //console.log("手机")
                let sb_bl1 = screen.windowSize.width / screen.windowSize.height;//设备屏幕比例
                return { width: screen.windowSize.width * sb_bl1 / win_bl1, height: screen.windowSize.height };
            }
            else {//手机竖屏摆放 或 当前设备是平板(平板不分横竖屏)
                let sb_bl2 = screen.windowSize.height / screen.windowSize.width;//设备屏幕比例 
                return { width: screen.windowSize.width, height: screen.windowSize.height * sb_bl2 / win_bl2 };
            }
        }
        else {//这个游戏是以竖屏为主设计的
            //console.log("竖屏逻辑设计")
            if (screen.windowSize.height / screen.windowSize.width > 1.4) {//手机竖屏摆放
                //console.log("手机")
                let sb_bl1 = screen.windowSize.width / screen.windowSize.height;//设备屏幕比例
                return { width: screen.windowSize.width * sb_bl1 / win_bl1, height: screen.windowSize.height };
            }
            else {//手机横屏摆放 或 当前设备是平板(平板不分横竖屏)
                let sb_bl2 = screen.windowSize.height / screen.windowSize.width;//设备屏幕比例 
                return { width: screen.windowSize.width, height: screen.windowSize.height * sb_bl2 / win_bl2 };
            }
        }

        return null;
    }

    /**
     * 让节点node以所在Canvas节点为参照 对齐手机屏幕边缘  alignTypeNum = alignType.LEFT_TO_LEFT|alignType.RIGHT_TO_LEFT
     */
    public static alignToFrameSize(node: Node, alignTypeNum: alignType): void {


        let canvas = director.getScene().getComponentInChildren(Canvas);
        if (!canvas) return;

        let newNode = new Node();
        newNode.parent = canvas.node;

        //智能识别
        if (screen.windowSize.width > screen.windowSize.height) {//这个项目是以横屏为主设计的
            console.log("横屏逻辑设计")
        }
        else {//这个游戏是以竖屏为主设计的
            console.log("竖屏逻辑设计")
        }
        newNode.uiTransform.setContentSize(newNode.parent.uiTransform.width, newNode.parent.uiTransform.height);



        //水平方向的对齐同时只有1种能生效
        if (alignTypeNum & alignType.LEFT_TO_LEFT) {
            alignMgr.leftToLeft(node, newNode, true);
        }
        else if (alignTypeNum & alignType.LEFT_TO_RIGHT) {
            alignMgr.leftToRight(node, newNode, true);
        }
        else if (alignTypeNum & alignType.RIGHT_TO_RIGHT) {
            alignMgr.rightToRight(node, newNode, true);
        }
        else if (alignTypeNum & alignType.RIGHT_TO_LEFT) {
            alignMgr.rightToLeft(node, newNode, true);
        }
        else if (alignTypeNum & alignType.V_CENTER_TO_CENTER) {
            alignMgr.vCenterToCenter(node, newNode, true);
        }

        //竖直方向的对齐同时只有1种能生效
        if (alignTypeNum & alignType.TOP_TO_TOP) {
            alignMgr.topToTop(node, newNode, true);
        }
        else if (alignTypeNum & alignType.TOP_TO_BOTTOM) {
            alignMgr.topToBottom(node, newNode, true);
        }
        else if (alignTypeNum & alignType.BOTTOM_TO_BOTTOM) {
            alignMgr.bottomToBottom(node, newNode, true);
        }
        else if (alignTypeNum & alignType.BOTTOM_TO_TOP) {
            alignMgr.bottomToTop(node, newNode, true);
        }
        else if (alignTypeNum & alignType.H_CENTER_TO_CENTER) {
            alignMgr.hCenterToCenter(node, newNode, true);
        }

        newNode.parent = null;
        newNode.destroy();
    }
}
if (DEBUG) {
    window["alignMgr"] = alignMgr;
    window["alignType"] = alignType;

    window["viewDesignSize"] = view.getDesignResolutionSize();//本项目的设计宽高 也就是Canvas的默认宽高 
}