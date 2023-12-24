import { Cloner, CMesh } from "./core";
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/";

interface ICSVector3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

export class MatrixCloner extends Cloner {
    static instance_nr: number;
    private _useInstances: boolean;
    private _size: ICSVector3;
    private _mcount: ICSVector3;
    private _iModeRelative: boolean;
    private _instance_nr: number;

    constructor(
        mesh: Array<Mesh>,
        scene: Scene,
        {
            useInstances = true,
            mcount = { x: 3, y: 3, z: 3 },
            size = { x: 2, y: 2, z: 2 },
            iModeRelative = false,
        } = {}
    ) {
        super();

        MatrixCloner.instance_nr = 0 | (MatrixCloner.instance_nr + 1);
        this._mesh = mesh;
        this._mesh.forEach(function (m: Mesh) {
            m.setEnabled(false);
        });

        this._scene = scene;
        this._useInstances = useInstances;
        this._clones = [];
        this._size = size;
        this._mcount = mcount;
        this._count = Number(mcount.x * mcount.y * mcount.z);
        this._iModeRelative = iModeRelative;
        this._instance_nr = MatrixCloner.instance_nr;
        this._rootNode = new CMesh(
            `rootMC_${MatrixCloner.instance_nr}`,
            this._scene,
            null,
            this
        );
        this.createClones();
        this.update();
    }

    createClone(parent: any): Mesh | null {
        const c = new MatrixCloner(this._mesh, this._scene, {
            mcount: this._mcount,
            size: this._size,
        });
        parent._cloner = c;
        if (c.root) {
            c.root.parent = parent;
        }

        return c.root;
    }

    createClones(start = 0): void {
        let cix = 0;
        for (let z = start; z < this._mcount.z; z++) {
            for (let y = start; y < this._mcount.y; y++) {
                for (let x = start; x < this._mcount.x; x++) {
                    const n = new CMesh(
                        `n_lc${MatrixCloner.instance_nr}_${x}${y}${z}`,
                        this._scene,
                        this._rootNode
                    );
                    this._clones.push(n);
                    const xyz =
                        x +
                        this._mcount.x * y +
                        this._mcount.x * this._mcount.y * z;
                    cix = xyz % this._mesh.length;
                    n.createClone(
                        this._mesh[cix],
                        this._useInstances,
                        `${this._mesh[cix].name}_mc${MatrixCloner.instance_nr}_${x}${y}${z}`
                    );
                }
            }
        }
        this.calcPos();
    }

    set mcount(m) {
        this._mcount = m;
        this.delete();
        this._count = Number(this._mcount.x * this._mcount.y * this._mcount.z);
        this.createClones();
    }

    get mcount() {
        return this._mcount;
    }

    get state() {
        return {
            mcount: {
                x: this._mcount.x,
                y: this._mcount.y,
                z: this._mcount.z,
            },
            size: {
                x: this._size.x,
                y: this._size.y,
                z: this._size.z,
            },
        };
    }

    set size(s) {
        this._size = s;
        this.update();
    }

    get size() {
        return this._size;
    }

    calcRot(): void {
        for (let i = 0; i < this._count!; i++) {
            const vRet = this.eRotate(Cloner.vZero);
            this._clones[i].getChildren()[0].rotation = vRet;
        }
    }

    calcSize(): void {
        for (let i = 0; i < this._count!; i++) {
            this._clones[i].getChildren()[0].scaling = this.eScale(Cloner.vOne);
        }
    }

    calcPos(): void {
        this.eReset();
        //  let cix = 0;
        for (let z = 0; z < this._mcount.z; z++) {
            for (let y = 0; y < this._mcount.y; y++) {
                for (let x = 0; x < this._mcount.x; x++) {
                    const xyz =
                        x +
                        this._mcount.x * y +
                        this._mcount.x * this._mcount.y * z;
                    //   cix = xyz % this._mesh.length;
                    const xo = (-this._size.x * (this._mcount.x - 1)) / 2;
                    const yo = (-this._size.y * (this._mcount.y - 1)) / 2;
                    const zo = (-this._size.z * (this._mcount.z - 1)) / 2;
                    this._clones[xyz].position.x = xo + x * this._size.x;
                    this._clones[xyz].position.y = yo + y * this._size.y;
                    this._clones[xyz].position.z = zo + z * this._size.z;
                    this._clones[xyz].getChildren()[0].position =
                        this.ePosition(Cloner.vZero);
                }
            }
        }
    }

    get root(): Mesh | null {
        return this._rootNode;
    }

    delete(): void {
        for (let i = this._count! - 1; i >= 0; i--) {
            this._clones[i].delete();
        }
        this._clones.length = 0;
        (this._rootNode as any).dispose();
    }

    update(): void {
        if (this._count! > 0) {
            this.calcRot();
            this.calcPos();
            this.calcSize();
        }
    }
}
