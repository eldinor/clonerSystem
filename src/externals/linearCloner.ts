import { Cloner, CMesh, RandomNumberGen } from "./core";
import type { Scene } from "@babylonjs/core/scene";
import type { Mesh } from "@babylonjs/core/Meshes/";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

/**
 * The LinearCloner instances/clones and distributes given meshes in a linear manner.
 * If more than one mesh is provided, then the corresponding clones will be placed subsequently one after another.
 * The LinearCloner can instantiated in two different interpolation-modes: absolute and relative.
 * In the first mode the values of the input parameters (scale/rotation/position) can be seen as the difference from the first to the last clone, whereas in the relative mode those values are the difference from clone to clone.
 * The LinearCloner returns an object with an important property: root.
 * It is an invisible mesh, it's the anchor and parent of all generated clones, its position is the position of the first clone.
 * Transforming this root affects all underlying clones (childs) at once but independently of the interpolation mode.
 * Most of the input parameters are also available as properties and they are very suitable for animation (tweening).
 * The given input meshes will be made inactive during construction. Input meshes may be other Cloners as well.
 * @param mesh The array of meshes/cloners to be cloned, meshes will be made inactive after construction.
 * @param scene Babylon scene.
 * @param count The number of instances/clones. Default 3.
 * @param offset The offset in world units in the direction of the transform position vector. Default 0.
 * @param growth The weight factor for all transform parameters in percent/100. Default 1.
 * @param P The position transform vector. Default { x: 0, y: 2, z: 0 }.
 *  @param S The scaling transform vector. Default 	{ x: 1, y: 1, z: 1}.
 * @param R The rotation transform vector. Default { x: 0, y: 0, z: 0 }.
 * @param iModeRelative The interpolation mode. Default false (absolute).
 * @param useInstances Flag if clones should be technical "clones" or "instances". Default true.
 */

export class LinearCloner extends Cloner {
    static instance_nr: number;
    private _useInstances: boolean;
    private _offset: number;
    private _P: Vector3;
    private _R: Vector3;
    private _S: Vector3;
    private _iModeRelative: boolean;
    private _growth: number;
    private _instance_nr: number;
    private _countNumberGen: number | null = null;

    constructor(
        mesh: Array<Mesh>,
        scene: Scene,
        {
            count = 0,
            offset = 0,
            growth = 1,
            useInstances = true,

            P = { x: 0, y: 2, z: 0 },
            S = { x: 1, y: 1, z: 1 },
            R = { x: 0, y: 0, z: 0 },
            iModeRelative = false,
        } = {}
    ) {
        super();
        LinearCloner.instance_nr = 0 | (LinearCloner.instance_nr + 1);
        this._mesh = mesh;
        this._mesh.forEach(function (m: Mesh) {
            m.setEnabled(false);
        });
        this._scene = scene;
        this._useInstances = useInstances;
        this._clones = [];
        this._countNumberGen =
            (count as any) instanceof RandomNumberGen ? count : null;
        this._count =
            (count as any) instanceof RandomNumberGen
                ? (count as any).nextInt()
                : Number(count);
        this._offset = offset;
        this._P = new Vector3(P.x, P.y, P.z);
        this._S = new Vector3(S.x, S.y, S.z);
        this._R = new Vector3(
            (R.x * Math.PI) / 180,
            (R.y * Math.PI) / 180,
            (R.z * Math.PI) / 180
        );
        this._iModeRelative = iModeRelative;
        this._growth = growth;
        this._instance_nr = LinearCloner.instance_nr;
        this._rootNode = new CMesh(
            `rootLC_${LinearCloner.instance_nr}`,
            this._scene,
            null,
            this
        );
        this.createClones();
        this.update();
    }
    createClone(parent: CMesh) {
        const cnt =
            this._countNumberGen != null
                ? (this._countNumberGen as any).nextInt()
                : this._count;
        const c = new LinearCloner(this._mesh, this._scene, {
            count: cnt,
            offset: this._offset,
            growth: this._growth,
            useInstances: this._useInstances,
            P: { x: this._P.x, y: this._P.y, z: this._P.z },
            S: { x: this._S.x, y: this._S.y, z: this._S.z },
            R: { x: this._R.x, y: this._R.y, z: this._R.z },
            iModeRelative: this._iModeRelative,
        });
        parent._cloner = c;
        if (c.root) {
            c.root.parent = parent;
        }

        return c.root;
    }
    private createClones(start = 0) {
        for (let i = start; i < this._count!; i++) {
            //create Node for each clone, RADIAL=>parent = rootnode
            const n = new CMesh(
                `n_lc${this._instance_nr}_${i}`,
                this._scene,
                this._rootNode
            );
            this._clones.push(n);
            //create instance or clone
            const cix = i % this._mesh.length;
            n.createClone(
                this._mesh[cix],
                this._useInstances,
                `${this._mesh[cix].name}_lc${this._instance_nr}_${i}`
            );
        }
    }

    private calcSize() {
        for (let i = 1; i < this._count!; i++) {
            const orig = Vector3.Lerp(
                Cloner.vOne,
                this._S,
                this._iModeRelative ? i : i / (this._count! - 1)
            );
            (this._clones[i].getChildren()[0] as Mesh).scaling =
                this.eScale(orig);
        }
    }
    private calcPos() {
        this.eReset();
        let f = this._growth;
        if (this._iModeRelative == false) {
            const tcm1 = this._count! == 1 ? 1 : this._count! - 1;
            f = (1 / tcm1) * this._growth;
        }
        for (let i = 0; i < this._count!; i++) {
            const off = Vector3.Lerp(Cloner.vZero, this._P, f * this._offset);
            const v = Vector3.Lerp(Cloner.vZero, this._P, i * f);
            const v2 = v.add(off);
            this._clones[i].position = this.ePosition(v2);
        }
    }

    private calcRot() {
        for (let i = 1; i < this._count!; i++) {
            const vRot = Vector3.Lerp(
                Cloner.vZero,
                this._R,
                this._iModeRelative
                    ? i * this._growth
                    : (i / (this._count! - 1)) * this._growth
            );
            (this._clones[i].getChildren()[0] as Mesh).rotation =
                this.eRotate(vRot);
        }
    }

    update() {
        if (this._count! > 0) {
            this.calcRot();
            this.calcPos();
            this.calcSize();
        }
    }
    recalc() {
        const cnt = this._count;
        this.count = 0;
        this.count = cnt;
    }
    get growth() {
        return this._growth;
    }
    set growth(g) {
        this._growth = g;
        this.update();
    }
    delete() {
        for (let i = this._count! - 1; i >= 0; i--) {
            this._clones[i].parent = null;
            this._clones[i].getChildren()[0].dispose();
            this._clones[i].dispose();
        }
        this._rootNode!.dispose();
    }
    set count(scnt) {
        const cnt = Number(scnt);

        if (cnt < Number(this._count)) {
            for (let i = this._count! - 1; i >= cnt; i--) {
                this._clones[i].delete();
            }
            this._count! = cnt;
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

    set iModeRel(mode: boolean) {
        const newMode = mode;
        let f = this._count! - 1;
        if (newMode && this._iModeRelative == false) {
            f = 1 / f;
        }
        this._R = Vector3.Lerp(Cloner.vZero, this._R, f);
        this._P = Vector3.Lerp(Cloner.vZero, this._P, f);
        this._S = Vector3.Lerp(Cloner.vOne, this._S, f);

        this._iModeRelative = newMode;
        this.update();
    }

    set position(pos) {
        this._P.x = pos.x;
        this._P.y = pos.y;
        this._P.z = pos.z;
        this.update();
    }
    get position() {
        return { x: this._P.x, y: this._P.y, z: this._P.z };
    }
    set scale(s) {
        this._S.x = s.x;
        this._S.y = s.y;
        this._S.z = s.z;
        this.update();
    }
    get scale() {
        return { x: this._S.x, y: this._S.y, z: this._S.z };
    }
    set rotation(r) {
        this._R.x = (r.x * Math.PI) / 180;
        this._R.y = (r.y * Math.PI) / 180;
        this._R.z = (r.z * Math.PI) / 180;
        this.update();
    }
    get rotation() {
        return {
            x: (this._R.x * 180) / Math.PI,
            y: (this._R.y * 180) / Math.PI,
            z: (this._R.z * 180) / Math.PI,
        };
    }
    get rotation3() {
        return new Vector3(this._R.x, this._R.y, this._R.z);
    }
    set rotation3(vec: Vector3) {
        this._R.x = vec.x;
        this._R.y = vec.y;
        this._R.z = vec.z;
        this.update();
    }
    set offset(o: number) {
        this._offset = o;
        this.update();
    }
    get offset() {
        return this._offset;
    }
    /**
     * Gets Cloner's root - an invisible mesh, the anchor and parent of all generated instances/clones.
     * Transforming this root affects all underlying clones (childs) at once.
     */
    get root() {
        return this._rootNode;
    }
    get meshes() {
        return this._mesh;
    }
}
