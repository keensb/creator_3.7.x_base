import { _decorator, Component, Node, SpriteFrame } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('Scene2')
export class Scene2 extends Component {
    @property(SpriteFrame)
    sf: SpriteFrame = null;

    start() {

    }

    update(deltaTime: number) {
        
    }
}

