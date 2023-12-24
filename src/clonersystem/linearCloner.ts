import { Cloner, CMesh, RandomNumberGen } from "./core";
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

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
    createClone(parent: any) {
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
    createClones(start = 0) {
        for (let i = start; i < this._count!; i++) {
            //create Node for each clone, RADIAL=>parent = rootnode
            const n = new CMesh(
                `n_lc${this._instance_nr}_${i}`,
                this._scene,
                this._rootNode
            );
            //n.index = i;
            this._clones.push(n);
            //create clone
            const cix = i % this._mesh.length;
            n.createClone(
                this._mesh[cix],
                this._useInstances,
                `${this._mesh[cix].name}_lc${this._instance_nr}_${i}`
            );
            //c.material.diffuseColor.g = 1-i / this._count;
        }
    }
    /*
    createClones2(start = 0) {
        var cix = 0;
        for (let i = start; i < this._count!; i++) {
            var n = new CMesh(
                `n_lc${LinearCloner.instance_nr}_${i}`,
                this._scene,
                i == 0 ? this._rootNode : this._clones[i - 1]
            );
            this._clones.push(n);
            cix = i % this._mesh.length;
            n.createClone(
                this._mesh[cix],
                this._useInstances,
                `${this._mesh[cix].name}_lc${LinearCloner.instance_nr}_${i}`
            );
        }
    }
    */
    calcSize() {
        for (let i = 1; i < this._count!; i++) {
            const orig = Vector3.Lerp(
                Cloner.vOne,
                this._S,
                this._iModeRelative ? i : i / (this._count! - 1)
            );
            this._clones[i].getChildren()[0].scaling = this.eScale(orig);
            //this._clones[i].scaling = this.eScale(orig);
        }
    }
    calcPos() {
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
    calcPos2() {
        this.eReset();
        let f = this._growth;
        if (this._iModeRelative == false) {
            const tcm1 = this._count! == 1 ? 1 : this._count! - 1;
            f = (1 / tcm1) * this._growth;
        }
        //shift offset
        this._clones[0].position = Vector3.Lerp(
            Cloner.vZero,
            this._P,
            f * this._offset
        );
        this._clones[0].position = this.ePosition(this._clones[0].position);
        for (let i = 1; i < this._count!; i++) {
            const v = Vector3.Lerp(Cloner.vZero, this._P, f);
            this._clones[i].position = v;
            this._clones[i].getChildren()[0].position = this.ePosition(
                Cloner.vZero
            );
        }
    }
    calcRot() {
        for (let i = 1; i < this._count!; i++) {
            //
            //   const item = this._clones[i].getChildren()[0];
            //
            //this._clones[i].getChildren()[0].rotation = Vector3.Lerp(Cloner.vZero, this._R, this._iModeRelative ? i * this._growth : i / (this._count! - 1) * this._growth);
            //this._clones[i].getChildren()[0].rotation = this.eRotate(Cloner.vZero);//   this._clones[i].rotation);
            const vRot = Vector3.Lerp(
                Cloner.vZero,
                this._R,
                this._iModeRelative
                    ? i * this._growth
                    : (i / (this._count! - 1)) * this._growth
            );
            this._clones[i].getChildren()[0].rotation = this.eRotate(vRot); //   this._clones[i].rotation);
        }
    }
    calcColor() {
        /*
        if (this._effectors.length > 0) {
            let e = this._effectors[0];
            for (let i = 1; i < this._count; i++) {
                let cr = e.effector.getRandomColor();
                let cg = e.effector.getRandomColor();
                let cb = e.effector.getRandomColor();
                this._clones[i].getChildren()[0].material.diffuseColor.r = cr;
                this._clones[i].getChildren()[0].material.diffuseColor.g = cg;
                this._clones[i].getChildren()[0].material.diffuseColor.b = cb;
            }
        }
        */
    }
    update() {
        if (this._count! > 0) {
            this.calcRot();
            this.calcPos();
            this.calcSize();
            //   this.calcColor();
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
    /**
     * Does some thing in old style.
     *
     * @deprecated use iModeRel instead.
     */
    set mode(m: any) {
        this.iModeRel = m == "step";
    }

    set iModeRel(mode: any) {
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
    get root() {
        return this._rootNode;
    }
    get mesh() {
        return this._mesh;
    }
}
