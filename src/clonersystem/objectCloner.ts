import { Cloner, CMesh } from "./core";
import { Scene } from "@babylonjs/core/scene";
import { Mesh } from "@babylonjs/core/Meshes/";

export class ObjectCloner extends Cloner {
    static instance_nr: number;
    private _useInstances = true;
    private _template;
    private _instance_nr;
    private _positions;
    private _normals;
    constructor(
        mesh: Array<Mesh>,
        template: Mesh,
        scene: Scene,
        { useInstances = true } = {}
    ) {
        super();
        ObjectCloner.instance_nr = 0 | (ObjectCloner.instance_nr + 1);
        this._mesh = mesh;
        this._scene = scene;
        this._template = template;
        this._useInstances = useInstances;
        this._clones = [];
        this._positions = template.getFacetLocalPositions();
        this._normals = template.getFacetLocalNormals();
        this._template.isVisible = false; //  setEnabled(false);
        this._mesh.forEach(function (m) {
            m.setEnabled(false);
        });
        this._instance_nr = ObjectCloner.instance_nr;
        this._rootNode = new CMesh(
            `rootOC_${ObjectCloner.instance_nr}`,
            this._scene,
            null,
            this
        );
        this.createClones();
        this.calcPos();
    }
    createClones() {
        let cix = 0;
        this._count = this._positions.length;
        for (let i = 0; i < this._positions.length; i++) {
            cix = i % this._mesh.length;
            const n = new CMesh(
                `n_lc${ObjectCloner.instance_nr}_${i}`,
                this._scene,
                this._rootNode
            );
            this._clones.push(n);
            n.createClone(
                this._mesh[cix],
                this._useInstances,
                `${this._mesh[cix].name}_mc${ObjectCloner.instance_nr}_${i}`
            );
        }
    }
    calcRot() {
        for (let i = 0; i < this._count!; i++) {
            const vRet = this.eRotate(Cloner.vZero);
            (this._clones[i].getChildren()[0] as Mesh).rotation = vRet;
        }
    }
    calcSize() {
        for (let i = 0; i < this._count!; i++) {
            this._clones[i].scaling = this.eScale(Cloner.vOne);
        }
    }
    calcPos() {
        this.eReset();
        for (let i = 0; i < this._clones.length; i++) {
            this._clones[i].position = this.ePosition(this._positions[i]);
            /*
            this._clones[i].position.x=this._positions[i].x;
            this._clones[i].position.y=this._positions[i].y;
            this._clones[i].position.z=this._positions[i].z;
            */
        }
    }
    update() {
        if (this._count! > 0) {
            this.calcRot();
            this.calcPos();
            this.calcSize();
        }
    }
    get root() {
        return this._rootNode;
    }
}
