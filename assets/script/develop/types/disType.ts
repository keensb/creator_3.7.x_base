/**
 * Created by YeXin on 2015/12/29.
 */
export module disTypes
{
    export class DriverType
    {
        //逐帧驱动正确的命名其实应该是 TIMELINE ,为了直观和防止与 TIMER 混淆,所以改为 FRAME
        public static FRAME:string = "runFrame";//逐帧驱动,如果要求播发速度始终与帧频一致或保持比例,建议使用该驱动方式;该方式下的播放速度可在理论上到达无上限
        public static TIMER:string = "runTimer";//计时器驱动,如果要求播放速度脱离帧频的直接控制,建议使用该驱动方式;该方式下的播放速度不能快于(1000/16)帧/秒,即63帧/秒已经是最大上限

        constructor()
        {
            throw new Error(this["__class__"] + " 是静态成员集成类，无需实例化");
        }
    }
}