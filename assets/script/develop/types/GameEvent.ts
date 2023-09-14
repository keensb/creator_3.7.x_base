export class GameEvent {
    public static readonly GRAPHICS_CHANGED = "graphicsChanged";
    /**可视对象加载进场景显示列表的通知*/
    public static readonly ADDED_TO_STAGE = "addedToStage";
    /**可视对象移除出场景显示列表的通知*/
    public static readonly REMOVED_FROM_STAGE = "removedFromStage";
    /**Laya.Node对象被销毁前的通知 便于清理一些自定义的临时变量或引用 主要用于开发自定义组件时避免使用onDestroy来执行销毁时的逻辑(因为组件的onDestroy是一个开放函数, 容易被覆盖)*/
    public static readonly BEFORE_DESTROY = "beforeDestroy";

    /**AnimationGroup 构建完成的通知(此时的AnimationGroup对象已关联了动画所需的纹理)*/
    public static readonly ANIM_RECONSTRUCTED = "animReconstructed";
    /**AnimationGroup 某片段完成一次循环的通知  附带参数 当前片段在列表中的下标currentPartIndex、 当前播放头在当前片段的位置 currentFrameInCurrentPart*/
    public static readonly ANIM_PART_LOOPED = "animLooped";
};
globalThis["GameEvent"] = GameEvent;