import { Cloner, CMesh } from "./core";
import type { Scene } from "@babylonjs/core/scene";
import type { Mesh } from "@babylonjs/core/Meshes/";

/**
 * The ObjectCloner clones and distributes the array of given meshes to the facet position of another input mesh which acts as a template.
 * If more than one mesh is provided, then the corresponding clones will be placed subsequently one after another starting in the order as the facets of the template mesh is defined.
 * @param mesh The array of meshes/cloners to be cloned, meshes will be made inactive after construction.
 * @param template The mesh acting as template.
 * @param useInstances Flag if clones should be technical "clones" or "instances". Default true.
 * @param isPickable Flag true if Cloner meshes should be pickable. Default false.

 */

export class ObjectCloner extends Cloner {
    static instance_nr: number;
    private _useInstances = true;
    private _template;
    private _instance_nr;
    private _positions;
    private _normals;
    private isPickable: boolean;
    constructor(
        mesh: Array<Mesh>,
        template: Mesh,
        scene: Scene,
        { useInstances = true, isPickable = false } = {}
    ) {
        super();
        ObjectCloner.instance_nr = 0 | (ObjectCloner.instance_nr + 1);
        this._mesh = mesh;
        this._scene = scene;
        this._template = template;
        this._useInstances = useInstances;
        this.isPickable = isPickable;
        this._clones = [];
        this._positions = template.getFacetLocalPositions();
        this._normals = template.getFacetLocalNormals();
        //   this._template.isVisible = false;
        this._template.setEnabled(false);
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
                `${this._mesh[cix].name}_mc${ObjectCloner.instance_nr}_${i}`,
                this.isPickable
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
        }
    }

    update() {
        if (this._count! > 0) {
            this.calcRot();
            this.calcPos();
            this.calcSize();
        }
    }

    /**
     * Gets Cloner's root - an invisible mesh, the anchor and parent of all generated instances/clones.
     * Transforming this root affects all underlying clones (childs) at once.
     */
    get root() {
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
}
