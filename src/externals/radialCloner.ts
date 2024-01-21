import { Cloner, CMesh } from "./core";
import type { Scene } from "@babylonjs/core/scene";
import type { Mesh } from "@babylonjs/core/Meshes/";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * The RadialCloner distributes given meshes in a radial manner. If more than one meshes are provided, then the clones will be placed alternatively.
 * Several parameters controls the position, angle, type and orientation of the clones.
 * @param mesh mesh to clone
 * @param scene
 * @param options all optional: count, offset, radius, startangle, endangle, useInstances, plane
 *@param count The number of instances/clones. Default 3.
 * @param radius The radius in world units. Default 3.
 * @param align Flag if clones are aligned against the middle position of the cloner. Default true
 * @param startangle The angle in degrees. Default 0.
 * @param endangle The angle in degrees. Default 360.
 * @param offset The angle in degrees.
 * @param useInstances Flag if clones should be technical "clones" or "instances". Default true = instances.
 * @param plane The object {x,y,z} describing the cloners orientation. Default { x: 1, y: 0, z: 1 }.
 */

export class RadialCloner extends Cloner {
    static instance_nr: number;
    private _instance_nr: number;
    private _useInstances: boolean;
    private _radius: number;
    private _plane: Vector3;
    private _startangle: number;
    private _endangle: number;
    private _offset: number;
    private _align: boolean;
    private isPickable: boolean;

    constructor(
        mesh: Array<Mesh>,
        scene: Scene,
        {
            count = 3,
            offset = 0,
            radius = 3,
            align = true,
            startangle = 0,
            endangle = 360,
            useInstances = true,
            plane = { x: 1, y: 0, z: 1 },
            isPickable = false,
        } = {}
    ) {
        super();
        RadialCloner.instance_nr = 0 | (RadialCloner.instance_nr + 1);
        this._instance_nr = RadialCloner.instance_nr;
        this._mesh = mesh;
        this._mesh.forEach(function (m) {
            m.setEnabled(false);
        });
        this._scene = scene;
        this._useInstances = useInstances;
        this.isPickable = isPickable;
        this._clones = [];
        this._count = Number(count);
        this._radius = Number(radius);
        this._plane = new Vector3(plane.x, plane.y, plane.z);
        this._startangle = (Math.PI * startangle) / 180;
        this._endangle = (Math.PI * endangle) / 180;
        this._offset = offset;
        this._align = align;
        this._frame = 0;
        this._index = 0;

        this._rootNode = new CMesh(
            `rootRC_${this._instance_nr}`,
            this._scene,
            null,
            this
        );

        this.createClones();
        this.update();
    }
    createClone(parent: CMesh) {
        const c = new RadialCloner(this._mesh, this._scene, {
            count: this._count,
            offset: this._offset,
            radius: this._radius,
            startangle: (this._startangle * 180) / Math.PI,
            endangle: (this._endangle * 180) / Math.PI,
            useInstances: this._useInstances,
            plane: { x: this._plane.x, y: this._plane.y, z: this._plane.z },
        });
        parent._cloner = c;
        c.root!.parent = parent;
        return c.root;
    }

    createClones(start = 0) {
        for (let i = start; i < this._count!; i++) {
            //create Node for each clone, RADIAL=>parent = rootnode
            const n = new CMesh(
                `n_rc${this._instance_nr}_${i}`,
                this._scene,
                this._rootNode
            );
            n._index = i;
            this._clones.push(n);
            //create instance or clone
            const cix = i % this._mesh.length;
            n.createClone(
                this._mesh[cix],
                this._useInstances,
                `${this._mesh[cix].name}_rc${this._instance_nr}_${i}`,
                this.isPickable
            );
        }
    }
    private calcRot() {
        for (let i = 0; i < this._count!; i++) {
            const arange = this._endangle - this._startangle;
            const step = arange / this._count!;
            (this._clones[i].getChildren()[0] as Mesh).rotation.x =
                (this._clones[i].getChildren()[0] as Mesh).rotation.y =
                (this._clones[i].getChildren()[0] as Mesh).rotation.z =
                    0;
            if (this._plane.y === 0) {
                (this._clones[i].getChildren()[0] as Mesh).rotation.y = this
                    ._align
                    ? this._offset + this._startangle + i * step
                    : 0;
            } else if (this._plane.x === 0) {
                (this._clones[i].getChildren()[0] as Mesh).rotation.x = this
                    ._align
                    ? -this._offset - this._startangle - i * step
                    : 0;
            } else {
                (this._clones[i].getChildren()[0] as Mesh).rotation.z = this
                    ._align
                    ? -this._offset - this._startangle - i * step
                    : 0;
            }

            const vRet = this.eRotate(
                (this._clones[i].getChildren()[0] as Mesh).rotation
            );
            (this._clones[i].getChildren()[0] as Mesh).rotation = vRet;
        }
    }
    private calcSize() {
        for (let i = 0; i < this._count!; i++) {
            (this._clones[i].getChildren()[0] as Mesh).scaling = this.eScale(
                Cloner.vOne
            );
        }
    }
    private calcPos() {
        this.eReset();
        for (let i = 0; i < this._count!; i++) {
            const arange = this._endangle - this._startangle;
            const step = arange / this._count!;
            this._clones[i].position.x =
                this._clones[i].position.y =
                this._clones[i].position.z =
                    0;
            if (this._plane.y === 0) {
                this._clones[i].position.x =
                    Math.sin(this._offset + this._startangle + i * step) *
                    this._radius;
                this._clones[i].position.z =
                    Math.cos(this._offset + this._startangle + i * step) *
                    this._radius;
                this._clones[i].position = this.ePosition(
                    this._clones[i].position
                );
            } else if (this._plane.x === 0) {
                this._clones[i].position.y =
                    Math.sin(this._offset + this._startangle + i * step) *
                    this._radius;
                this._clones[i].position.z =
                    Math.cos(this._offset + this._startangle + i * step) *
                    this._radius;
                this._clones[i].position = this.ePosition(
                    this._clones[i].position
                );
            } else {
                this._clones[i].position.x =
                    Math.sin(this._offset + this._startangle + i * step) *
                    this._radius;
                this._clones[i].position.y =
                    Math.cos(this._offset + this._startangle + i * step) *
                    this._radius;
                this._clones[i].position = this.ePosition(
                    this._clones[i].position
                );
            }
        }
    }
    update() {
        this.calcRot();
        this.calcPos();
        this.calcSize();
    }

    /**
     * Deletes all Cloner's children and disposes the root Node.
     */
    delete() {
        for (let i = this._count! - 1; i >= 0; i--) {
            this._clones[i].delete();
        }
        if (this._rootNode) {
            this._rootNode.dispose();
        }
    }
    recalc() {
        const cnt = this._count;
        this.count = 0;
        this.count = cnt;
    }
    set count(scnt) {
        const cnt = Number(scnt);
        if (cnt < Number(this._count)) {
            for (let i = this._count! - 1; i >= cnt; i--) {
                this._clones[i].delete();
            }
            this._count = cnt;
            this._clones.length = cnt;
        } else if (cnt > Number(this._count)) {
            const start = this._count;
            this._count = cnt;
            this.createClones(start);
        }
        this.update();
    }
    get count() {
        return this._count;
    }
    set offset(off) {
        this._offset = (Math.PI * off) / 180;
        this.update();
    }
    get offset() {
        return (this._offset * 180) / Math.PI;
    }
    get root() {
        return this._rootNode;
    }
    set radius(r) {
        this._radius = r;
        this.update();
    }
    get radius() {
        return this._radius;
    }
    set align(a) {
        this._align = a;
        this.update();
    }
    get align() {
        return this._align;
    }
    set startangle(sa) {
        this._startangle = (Math.PI * sa) / 180;
        this.update();
    }
    get startangle() {
        return (this._startangle * 180) / Math.PI;
    }
    set endangle(se) {
        this._endangle = (Math.PI * se) / 180;
        this.update();
    }
    get endangle(): number {
        return (this._endangle * 180) / Math.PI;
    }
    set plane(p: Vector3) {
        this._plane = new Vector3(p.x, p.y, p.z);
        this.update();
    }
    setScaling(ix: number, sc: Vector3) {
        this._clones[ix].scaling = new Vector3(sc.x, sc.y, sc.z);
        this.update();
    }
}
