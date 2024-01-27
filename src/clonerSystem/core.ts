import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { Scene } from "@babylonjs/core/scene";
import { InstancedMesh, Mesh } from "@babylonjs/core/Meshes/";

export class CMesh extends Mesh {
    public _cloner: Cloner | null = null;
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

    createClone(
        item: Cloner | Mesh,
        useInstances: boolean,
        name: string,
        isPickable: boolean
    ) {
        let c: Mesh | InstancedMesh | void;
        if (item instanceof Cloner) {
            c = item.createClone(this);
            console.log("instanceof Cloner CASE");
        } else {
            if (useInstances) {
                c = item.createInstance(name + "_i");
                c.isPickable = isPickable;
                c.parent = this;
            } else {
                c = item.clone(name + "_c");
                c.setEnabled(true);
                c.parent = this;
                c.isPickable = this.isPickable;
            }
        }

        return c;
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
}

export class Cloner {
    static vOne = new Vector3(1, 1, 1);
    static vZero = new Vector3(0, 0, 0);
    _rootNode: Mesh | null = null;
    _mesh: Array<Mesh> = [];
    _scene!: Scene;
    _clones!: Array<CMesh>;
    _frame!: number;
    _index!: number;

    _count: number | undefined;
    _effectors: Array<IEffector> = [];

    createClone(_parent: Mesh) {
        throw new Error("Method not implemented.");
    }

    /**
     * Deletes all Cloner's children and disposes the root Node.
     */
    delete() {
        throw new Error("Method not implemented.");
    }

    /**
     * set the cloner's root node to the state of the flag (true=enabled)
     *
     * @param enabled
     */
    setEnabled(enabled: boolean) {
        if (this._rootNode !== null) {
            this._rootNode.setEnabled(enabled);
        }
    }

    update() {
        throw new Error("Method not implemented.");
    }
    /**
     * Adds an effector to this Cloner and sets the sensitivity (1=full sensitivity, 0=no sensitivity ==ignore effector)
     *
     * @param effector
     * @param sensitivity
     */
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
        return vRet;
    }
    eReset() {
        this._effectors.forEach(function (e: IEffector) {
            e.effector.reset();
        });
    }
    getScene() {
        return this._scene;
    }

    /**
     * Converts the Cloner to thin instances, then deletes this Cloner and returns an array of Cloner meshes. The source meshes are cloned, their clones set enabled. To display them use addSelf = true.
     * All cloned source meshes get the new parent with the rootName.
     * Be aware that the original Cloner will be disposed, so Cloner methods will not work anymore. Use the root node and its individual child meshes for further processing.
     *
     * @param addSelf If true, adds the source mesh to the matrix. Default false.
     * @param rootName Allow to define the name of the root mesh which will be the parent of cloned source meshes and all thin instances.
     * If empty, Cloner class name will be used for the name.
     */
    toThin(addSelf?: boolean, rootName?: string): Mesh[] {
        //  console.log("cSystem", this);
        //  console.log("addSelf", addSelf);

        let scale, rot, pos;
        const clonedMeshArray: Array<Mesh> = [];

        rootName = rootName ? rootName : this.constructor.name;

        const thinRoot = new Mesh(rootName);

        this._mesh.forEach((element, index) => {
            const cloned = element.clone(element.name + "_cl_" + index);
            cloned.setEnabled(true);
            cloned.makeGeometryUnique();
            cloned.setParent(thinRoot);
            clonedMeshArray.push(cloned);
        });

        this._clones.forEach((c, index) => {
            const inst = c.getChildren()[0] as InstancedMesh;

            pos = c.position;
            rot = Quaternion.FromEulerVector(inst.rotation);
            scale = inst.scaling;

            const meshIndex = index % this._mesh.length;

            const matrix = Matrix.Compose(scale, rot, pos);
            clonedMeshArray[meshIndex].thinInstanceAdd(matrix);

            if (addSelf) {
                clonedMeshArray[meshIndex].thinInstanceAddSelf();
            }
        });

        this.delete();

        console.log(clonedMeshArray);
        return clonedMeshArray;
    }

    /**
     * Converts all Cloner meshes to thin instances from the original meshes, then deletes this Cloner and returns an array of Cloner meshes.
     * Be aware that instances of those original meshes become disabled, so if they are used in other Cloners one may want to use toThin() method instead.
     * If you don't need animations and so on you may convert Cloner to thin instances. It greatly reduces the number of objects iterating in the render loop.
     * @param addSelf If true, adds the source mesh to the matrix. Default false.
     * @returns The array of original meshes: Mesh[]
     */
    toThinOriginals(addSelf?: boolean): Mesh[] {
        //  console.log("cSystem", this);
        //  console.log("addSelf", addSelf);

        let scale, rot, pos;

        this._clones.forEach((c, index) => {
            const inst = c.getChildren()[0] as InstancedMesh;

            pos = c.position;
            rot = Quaternion.FromEulerVector(inst.rotation);
            scale = inst.scaling;

            const meshIndex = index % this._mesh.length;

            const matrix = Matrix.Compose(scale, rot, pos);
            this._mesh[meshIndex].thinInstanceAdd(matrix);
            this._mesh[meshIndex].setEnabled(true);

            if (addSelf) {
                this._mesh[meshIndex].thinInstanceAddSelf();
            }
        });

        this.delete();

        console.log(this._mesh);
        return this._mesh;
    }
}

//

export interface IEffector {
    effector: RandomEffector;
    sensitivity: number;
}

/**
 * Each Cloner can have a set of Effectors assigned.
 * The Effector influences properties of the clones cloned by a Cloner.
 * The RandomEffector can influence all transfomation properties (scale/rotation/position) with repeatable random values.
 * Different random sequences can be achieved with a different seed value.
 * The RandomEffector can serve more than one cloner but it has only one property to control the strength of the random values.
 * Therefore each cloner has a property sensitivity to accept either all or only a portion of the cloners strength.
 * Note: the scaling transformation will be done in two different ways depending on the property uniformScale:
 * if this property is set to true, only one random value will be used for all three scaling components (x,y,z) and the y/z componets of the scale property will be ignored.
 * If set to false, each direction is scaled independently with an extra random value.
 * @param seed The the seed value for generating different sequences of random values. Default 42.
 * @param strength Sets the strength of the generator (range 0 to 1).
 * @param uniformScale true => all scaling directions with one value, false independently scaling.
 * @param position Sets position values in the range 0 to {x: number, y: number, z: number}.
 * @param scale Sets scaling values in the range 0 to {x: number, y: number, z: number}.
 * @param rotation Sets rotation values in the range 0 to {x: number, y: number, z: number}.
 */
export class RandomEffector {
    private _seed: number;
    private _s: number;
    private _rfunction;
    private _strength = 0.0;
    private _position: Vector3 = Vector3.Zero();
    private _rotation: Vector3 = Vector3.Zero();
    private _scale: Vector3 = Vector3.Zero();
    private _uniformScale = false;
    private _clients: Array<Cloner> = [];
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
        return vec.add(m1);
    }
    addClient(c: Cloner) {
        this._clients.push(c);
    }

    /**
     * Call this function after creating and setting the effector to update instances/clones transforms.
     */
    updateClients() {
        this._clients.forEach(function (c: Cloner) {
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
    set rotation(r: { x: number; y: number; z: number }) {
        this._rotation.x = (r.x * Math.PI) / 180;
        this._rotation.y = (r.y * Math.PI) / 180;
        this._rotation.z = (r.z * Math.PI) / 180;
    }
    get rotation(): Vector3 {
        return this._rotation;
    }
    rot(r: { x: number; y: number; z: number }) {
        this.rotation = r;
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
