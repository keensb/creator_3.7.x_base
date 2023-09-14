export namespace TimerUtils {
    /**
     * 异步轮询判断和回调逻辑 在计时器中循环调用一个 条件方法 直到其返回为true时, 立即执行回调方法并结束计时器循环  主要用于处理 当多个 不确定条件 或 苛刻条件 在某一时刻都同时成立时的业务
     * @param   condition   条件方法    建议使用箭头函数 ()=>{}  默认情况下本条件方法第一次会同步执行  如果返回结果为false接下来将以每1000/60毫秒1次的频率被轮询 直到返回true时就会执行下面的callBack  或被主动结束为止
     * @param   callBack    回调方法    建议使用箭头函数 ()=>{}  当本方法被执行时, 会主动结束轮询条件方法的状态
     * @param   thisObj     回调this对象    主要用于在debug阶段 方便在异步回调中通过断点查找 注册位置
     * @param   realTime    在调用本方法时 就立即同步判断条件方法  如果已满足条件方法,则立即执行回调方法 并且不会进入轮询状态  默认开启    
     * @param   judgeTimes  判断的总次数 如果超过此阈值仍未满足可执行条件 主动放弃执行回调 并结束轮询  若该值为0的话,※除非满足条件或手动移除, 否则永远不会自动结束(谨慎使用, 小心内存泄漏; 此函数在执行时返回的id, 建议长期持有, 在相关模块关闭时可通过id主动移除这个循环)※  这里默认为600次(理论上持续轮询10秒后自动移除)
     * @returns 一个注册时返回的计时器ID  应当持有此ID用于取消或结束该计时器循环   (可以使用clearInterval来结束, 例如 clearInterval(timeID))
     * @example 示例 轮询判断当满足条件: 对象target被创建出来, 并被加载到舞台上, 同时透明度不为0, 并且visible为true时 ,控制台立即打印出"hello"; 否则进入每秒60次的轮询, 直到所有条件都同时满足或手动移除为止, 控制台异步打印出"hello",并结束轮询
     * TimerUtils.execFuncOn(
     *  ()=>{
     *      return this.target != null && this.target.scene != null && this.target.alpha != 0 && this.target.visible == true;
     *  },
     *  ()=>{
     *      console.log("hello");
     *  }, null , 0
     * )
     */
    export function execFuncOn(condition: () => boolean, callBack: Function, thisObj: any, realTime: boolean = true, judgeTimes: number = 600): number {
        let _this = thisObj;//这个 thisObj 正确使用方法是: 通过断点 查找注册和异步调用本方法的 Class  或  superClass  防止内存泄露
        if (realTime && condition.call(_this) == true) {
            callBack.call(_this);
            return 0;
        }
        let loopJudgeTimes = 0;
        let timeID = setInterval(() => {
            //console.log("断点 check 哪里在不断调用本方法", thisObj, condition.toString(), callBack.toString());
            if (judgeTimes > 0) {
                loopJudgeTimes++;
                if (loopJudgeTimes > judgeTimes) {
                    clearInterval(timeID);
                    return;
                }
            }
            if (condition.call(_this) == true) {
                callBack.call(_this);
                clearInterval(timeID);
            }
        }, 1000 / 60);
        return timeID;
    }

    export function clearFuncByID(timeID: number): void {
        clearInterval(timeID);
    }
}