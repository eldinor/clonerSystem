import { Cloner, CMesh } from "./core";
import type { Scene } from "@babylonjs/core/scene";
import type { Mesh } from "@babylonjs/core/Meshes/";
// import {Mesh } from "@babylonjs/core/Meshes/";

export interface ICSVector3 {
    readonly x: number;
    readonly y: number;
    readonly z: number;
}

/**
 * The MatrixCloner clones and distributes given meshes in 3D space. If more than one mesh is provided, then the corresponding clones will be placed subsequently one after another starting in the x direction followed by y and z direction.
 * The MatrixCloner returns an object with an important property: root.
 * It is an invisible mesh, it's the anchor and parent of all generated clones, its position is the middle position of all generated clones. Transforming this root affects all underlying clones (childs) at once.
 * The given input meshes will be made inactive during construction.
 * @param mesh The array of meshes/cloners to be cloned, meshes will be made inactive after construction.
 * @param scene Babylon scene.
 * @param mcount The number of clones in x,y and z direction. Default { x: 3, y: 3, z: 3 }.
 * @param size The distance from one clon to another in x,y and z direction. Default { x: 2, y: 2, z: 2 }.
 * @param useInstances Flag if clones should be technical "clones" or "instances". Default true.
 */

export class MatrixCloner extends Cloner {
    static instance_nr: number;
    private _useInstances: boolean;
    private _size: ICSVector3;
    private _mcount: ICSVector3;
    private _iModeRelative: boolean;
    private _instance_nr: number;
    isPickable: boolean;

    constructor(
        mesh: Array<Mesh>,
        scene: Scene,

        {
            useInstances = true,
            mcount = { x: 3, y: 3, z: 3 },
            size = { x: 2, y: 2, z: 2 },
            iModeRelative = false,
            isPickable = false,
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
        this.isPickable = isPickable;
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

    createClone(parent: CMesh): Mesh | null {
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

    private createClones(start = 0): void {
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
                        `${this._mesh[cix].name}_mc${MatrixCloner.instance_nr}_${x}${y}${z}`,
                        this.isPickable
                    );
                }
            }
        }
        this.calcPos();
    }
    /**
     * Sets the number of instances / clones in x, y and z directions.
     */
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

    private calcRot(): void {
        for (let i = 0; i < this._count!; i++) {
            const vRet = this.eRotate(Cloner.vZero);
            (this._clones[i].getChildren()[0] as Mesh).rotation = vRet;
        }
    }

    private calcSize(): void {
        for (let i = 0; i < this._count!; i++) {
            (this._clones[i].getChildren()[0] as Mesh).scaling = this.eScale(
                Cloner.vOne
            );
            //    console.log((this._clones[i].getChildren()[0] as Mesh).scaling);
        }
    }

    private calcPos(): void {
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
                    (this._clones[xyz].getChildren()[0] as Mesh).position =
                        this.ePosition(Cloner.vZero);
                    //   console.log(this._clones[xyz].position);
                }
            }
        }
    }
    /**
     * Gets Cloner's root - an invisible mesh, the anchor and parent of all generated instances/clones.
     * Transforming this root affects all underlying clones (childs) at once.
     */
    get root(): Mesh | null {
        return this._rootNode;
    }

    /**
     * Deletes all Cloner's children and disposes the root Node.
     */
    delete(): void {
        for (let i = this._count! - 1; i >= 0; i--) {
            this._clones[i].delete();
        }
        this._clones.length = 0;
        if (this._rootNode) {
            this._rootNode.dispose();
        }
    }

    update(): void {
        if (this._count! > 0) {
            this.calcRot();
            this.calcPos();
            this.calcSize();
        }
    }
}
