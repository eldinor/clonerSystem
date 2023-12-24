import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { InstancedMesh, Mesh } from "@babylonjs/core/Meshes/";

export class CMesh extends Mesh {
    private _cloner: Cloner | null = null;
    public _index = 0;

    constructor(
        name: string,
        scene: Scene,
        parent: Mesh | null,
        cloner: Cloner | null = null
    ) {
        super(name, scene, parent);
        this._cloner = cloner;
        this.parent = parent;
    }
    delete() {
        if (this._cloner != null) {
            this._cloner.delete();
        } else {
            this.getChildren()[0].dispose();
        }
        this.parent = null;
        this.dispose();
    }
    createClone(item: Cloner | Mesh, useInstances: boolean, name: string) {
        let c: Mesh | InstancedMesh | void;
        if (item instanceof Cloner) {
            c = item.createClone(this);
            console.log("instanceof Cloner CASE");
        } else {
            if (useInstances) {
                c = item.createInstance(name + "_i");
                c.parent = this;
            } else {
                c = item.clone(name + "_c");
                c.setEnabled(true);
                c.parent = this;
            }
        }

        return c;
    }
}

export class Cloner {
    static vOne = new Vector3(1, 1, 1);
    static vZero = new Vector3(0, 0, 0);
    _rootNode: Mesh | null = null;
    _mesh: Array<Mesh> = [];
    _scene!: Scene;
    _clones!: Array<any>;
    _frame!: number;
    _index!: number;

    _count: number | undefined;
    _effectors: Array<any> = [];

    delete() {
        throw new Error("Method not implemented.");
    }

    setEnabled(enabled: boolean) {
        if (this._rootNode !== null) {
            this._rootNode.setEnabled(enabled);
        }
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createClone(_parent: Mesh) {
        throw new Error("Method not implemented.");
    }

    update() {
        throw new Error("Method not implemented.");
    }

    addEffector(effector: RandomEffector, sensitivity: number) {
        this._effectors.push({
            effector: effector,
            sensitivity: sensitivity,
        });
        effector.addClient(this);
        this.update();
    }

    get effectors() {
        return this._effectors;
    }

    eScale(vec: Vector3): Vector3 {
        let vRet = Cloner.vZero.add(vec);
        for (let i = 0; i < this._effectors.length; i++) {
            vRet = Vector3.Lerp(
                vec,
                this._effectors[i].effector.updateScale(vRet),
                this._effectors[i].sensitivity
            );
        }
        return vRet;
    }
    eRotate(vec: Vector3): Vector3 {
        let vRet = Cloner.vZero.add(vec);
        for (let i = 0; i < this._effectors.length; i++) {
            vRet = Vector3.Lerp(
                vec,
                this._effectors[i].effector.updateRotation(vRet),
                this._effectors[i].sensitivity
            );
        }
        return vRet;
    }
    ePosition(vec: Vector3): Vector3 {
        let vRet = Cloner.vZero.add(vec);
        for (let i = 0; i < this._effectors.length; i++) {
            vRet = Vector3.Lerp(
                vec,
                this._effectors[i].effector.updatePosition(vRet),
                this._effectors[i].sensitivity
            );
        }
        return vRet; // Vector3.Lerp(vec,vRet,this._effectorStrength.x);
    }
    eReset() {
        this._effectors.forEach(function (e: any) {
            e.effector.reset();
        });
    }
    getScene() {
        return this._scene;
    }
}

//

export class RandomEffector {
    private _seed: number;
    private _s: number;
    private _rfunction;
    private _strength = 0.0;
    private _position: Vector3 = new Vector3(0, 0, 0);
    private _rotation: Vector3 = new Vector3(0, 0, 0);
    private _scale: Vector3 = new Vector3(0, 0, 0);
    private _uniformScale = false;
    private _clients: Array<any> = [];
    constructor(seed = 42) {
        this._seed = this._s = seed;
        this._rfunction = () => {
            this._s = Math.sin(this._s) * 10000;
            return this._s - Math.floor(this._s);
        };
    }
    random(): number {
        return this._rfunction();
    }
    reset(): void {
        this._s = this._seed;
    }
    updateRotation(vec: Vector3) {
        const m1 = this._rotation.multiplyByFloats(
            (-0.5 + this.random()) * this._strength,
            (-0.5 + this.random()) * this._strength,
            (-0.5 + this.random()) * this._strength
        );
        return vec.add(m1);
    }
    updatePosition(vec: Vector3) {
        const m1 = this._position.multiplyByFloats(
            (-0.5 + this.random()) * this._strength,
            (-0.5 + this.random()) * this._strength,
            (-0.5 + this.random()) * this._strength
        );
        return vec.add(m1);
    }
    updateScale(vec: Vector3) {
        const a = this.random();
        let b = a;
        let c = a;
        if (this._uniformScale == false) {
            b = this.random();
            c = this.random();
        }
        const m1 = this._scale.multiplyByFloats(
            (-0.5 + a) * this._strength,
            (-0.5 + b) * this._strength,
            (-0.5 + c) * this._strength
        );
        //var m1=this._scale.multiplyByFloats(this._strength,this._strength,this._strength);
        return vec.add(m1);
    }
    addClient(c: any) {
        this._clients.push(c);
    }
    updateClients() {
        this._clients.forEach(function (c: any) {
            c.update();
        });
        return this;
    }
    get strength(): number {
        return this._strength;
    }
    set strength(s: number) {
        this._strength = s;
    }
    str(s: number) {
        this.strength = s;
        return this;
    }
    set position(p: { x: number; y: number; z: number }) {
        this._position.x = p.x;
        this._position.y = p.y;
        this._position.z = p.z;
    }
    get position(): Vector3 {
        return this._position;
    }
    set scale(s: { x: number; y: number; z: number }) {
        this._scale.x = this._scale.y = this._scale.z = s.x;
        if (this._uniformScale == false) {
            this._scale.y = s.y;
            this._scale.z = s.z;
        }
    }
    get scale(): Vector3 {
        return this._scale;
    }
    set rotation(s: { x: number; y: number; z: number }) {
        this._rotation.x = (s.x * Math.PI) / 180;
        this._rotation.y = (s.y * Math.PI) / 180;
        this._rotation.z = (s.z * Math.PI) / 180;
    }
    get rotation(): Vector3 {
        return this._rotation;
    }
    rot(s: { x: number; y: number; z: number }) {
        this.rotation = s;
        return this;
    }
    pos(p: { x: number; y: number; z: number }) {
        this.position = p;
        return this;
    }

    set seed(s: number) {
        this._seed = this._s = s;
    }
    get seed(): number {
        return this._seed;
    }
    set uniformScale(flag: boolean) {
        this._uniformScale = flag;
    }
    get uniformScale(): boolean {
        return this._uniformScale;
    }
    getRandomColor(): number {
        return this.random();
    }
    getRandomInt({ min = 0, max = 10 } = {}): number {
        return min + Math.floor(this.random() * (max - min));
    }
}

export class RandomNumberGen {
    private _min;
    private _max;
    private _generator;
    constructor({ min = 0, max = 10, seed = 1234 } = {}) {
        this._min = min;
        this._max = max;
        this._generator = new RandomEffector(seed);
        return this;
    }
    nextInt(): number {
        return this._generator.getRandomInt({
            min: this._min,
            max: this._max,
        });
    }
}
