import { Cloner, CMesh } from "./core";
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";

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
    private _formula: string;
    // private _colorize: ColorEffector;

    /**
     *
     * @param mesh mesh to clone
     * @param scene
     * @param param2 all optional: count, offset, radius startangle, endangle, useInstances, plane,colorize
     * if colorize function is provided, useInstances is set to false!
     */
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
            // colorize = null,
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
        /*
        this._colorize = colorize;
        if (colorize != null) this._useInstances = false;
        */
        this._formula =
            "2-Math.pow(Math.abs(Math.sin(frame/10+Math.PI*i/2)),0.1)*1.5";
        this._formula = "scaling=1-Math.sin(frame/6+2*ix*Math.PI)/2";

        //this._rootNode=new CMesh("root",this._scene,this);
        this._rootNode = new CMesh(
            `rootRC_${this._instance_nr}`,
            this._scene,
            null,
            this
        );
        this._scene.registerBeforeRender(() => {
            this._frame++;
            this._index = 0;
        });
        this.createClones();
        this.update();
    }
    createClone(parent: any) {
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
            //create clone
            const cix = i % this._mesh.length;
            n.createClone(
                this._mesh[cix],
                this._useInstances,
                `${this._mesh[cix].name}_rc${this._instance_nr}_${i}`
            );
            /*
            if (this._colorize != null) {
                c.registerBeforeRender(() => {
                    let color = this._colorize.animate(
                        c.parent._index / this._count,
                        this._frame
                    );
                    c.material.diffuseColor.r = color.r;
                    c.material.diffuseColor.g = color.g;
                    c.material.diffuseColor.b = color.b;
                    //if (color.r < 0.5)
                    c.material.alpha = color.a;
                });
            }
            */
        }
    }
    calcRot() {
        for (let i = 0; i < this._count!; i++) {
            const arange = this._endangle - this._startangle;
            const step = arange / this._count!;
            this._clones[i].getChildren()[0].rotation.x =
                this._clones[i].getChildren()[0].rotation.y =
                this._clones[i].getChildren()[0].rotation.z =
                    0;
            if (this._plane.y === 0) {
                this._clones[i].getChildren()[0].rotation.y = this._align
                    ? this._offset + this._startangle + i * step
                    : 0;
            } else if (this._plane.x === 0) {
                this._clones[i].getChildren()[0].rotation.x = this._align
                    ? -this._offset - this._startangle - i * step
                    : 0;
            } else {
                this._clones[i].getChildren()[0].rotation.z = this._align
                    ? -this._offset - this._startangle - i * step
                    : 0;
            }

            const vRet = this.eRotate(
                this._clones[i].getChildren()[0].rotation
            );
            this._clones[i].getChildren()[0].rotation = vRet;
        }
    }
    calcSize() {
        for (let i = 0; i < this._count!; i++) {
            //var orig=Vector3.Lerp(Cloner.vOne, this._S, this._iModeRelative ? i : i / (this._count - 1));
            this._clones[i].getChildren()[0].scaling = this.eScale(Cloner.vOne);
        }
    }
    calcPos() {
        this.eReset();
        for (let i = 0; i < this._count!; i++) {
            const arange = this._endangle - this._startangle;
            const step = arange / this._count!;
            this._clones[i].position.x =
                this._clones[i].position.y =
                this._clones[i].position.z =
                    0;
            //this._clones[i].getChildren()[0].rotation.x = this._clones[i].getChildren()[0].rotation.y = this._clones[i].getChildren()[0].rotation.z = 0;
            if (this._plane.y === 0) {
                this._clones[i].position.x =
                    Math.sin(this._offset + this._startangle + i * step) *
                    this._radius;
                this._clones[i].position.z =
                    Math.cos(this._offset + this._startangle + i * step) *
                    this._radius;
                //console.log(this._clones[i].position);
                this._clones[i].position = this.ePosition(
                    this._clones[i].position
                );
                //this._clones[i].getChildren()[0].rotation.y = this._align ? this._offset + this._startangle + i * step : 0;
                //this._clones[i].scaling=RadialCloner.vOne.multiplyByFloats(1,(0.5+(this.frame%this._count))/this._count,1);
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
                //this._clones[i].getChildren()[0].rotation.x = this._align ? -this._offset - this._startangle - i * step : 0;
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
                //this._clones[i].getChildren()[0].rotation.z = this._align ? -this._offset - this._startangle - i * step : 0;
            }
        }
    }
    update() {
        this.calcRot();
        this.calcPos();
        this.calcSize();
    }
    delete() {
        for (let i = this._count! - 1; i >= 0; i--) {
            this._clones[i].delete();
        }
        this._rootNode!.dispose();
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
