import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Matrix, Quaternion, Vector3 } from "@babylonjs/core/Maths/math.vector";
import { CreateSphere } from "@babylonjs/core/Meshes/Builders/sphereBuilder";
import { CreateGround } from "@babylonjs/core/Meshes/Builders/groundBuilder";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateSceneClass } from "../createScene";

// If you don't need the standard material you will still need to import it since the scene requires it.
// import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import grassTextureUrl from "../../assets/grass.jpg";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";
import { ShadowGenerator } from "@babylonjs/core/Lights/Shadows/shadowGenerator";

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Culling/ray";
import { MatrixCloner } from "../externals/matrixCloner";
import {
    LinearCloner,
    ObjectCloner,
    RadialCloner,
    RandomEffector,
} from "../externals";

import { Animation } from "@babylonjs/core/Animations/animation";

import {
    HemisphericLight,
    InstancedMesh,
    Mesh,
    MeshBuilder,
} from "@babylonjs/core";
import { Cloner } from "../externals/core";

export class DefaultSceneWithTexture implements CreateSceneClass {
    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);

        // Uncomment to load the inspector (debugging) asynchronously

        void Promise.all([
            import("@babylonjs/core/Debug/debugLayer"),
            import("@babylonjs/inspector"),
        ]).then((_values) => {
            console.log(_values);
            scene.debugLayer.show({
                handleResize: true,
                overlay: true,
                embedMode: true,
                globalRoot: document.getElementById("#root") || undefined,
            });
        });

        // This creates and positions a free camera (non-mesh)
        const camera = new ArcRotateCamera(
            "my first camera",
            0,
            Math.PI / 3,
            10,
            new Vector3(0, 0, 0),
            scene
        );

        // This targets the camera to scene origin
        camera.setTarget(Vector3.Zero());

        // This attaches the camera to the canvas
        camera.attachControl(canvas, true);

        // Our built-in 'sphere' shape.
        const sphere = CreateSphere(
            "sphere",
            { diameter: 2, segments: 32 },
            scene
        );

        const light = new HemisphericLight("hemi", Vector3.Up(), scene);
        light.intensity = 0.6;

        // Move the sphere upward 1/2 its height
        //   sphere.position.y = 1;

        // Our built-in 'ground' shape.
        /*
        const ground = CreateGround("ground", { width: 6, height: 6 }, scene);

        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);

        ground.material = groundMaterial;
        ground.receiveShadows = true;

        const light = new DirectionalLight(
            "light",
            new Vector3(0, -1, 1),
            scene
        );
        light.intensity = 0.5;
        light.position.y = 10;

        const shadowGenerator = new ShadowGenerator(512, light);
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.blurScale = 2;
        shadowGenerator.setDarkness(0.2);

        shadowGenerator.getShadowMap()!.renderList!.push(sphere);
        */

        const box = MeshBuilder.CreateBox("box");

        //   const box1 = box.clone();
        //   box1.makeGeometryUnique();

        const mc = new MatrixCloner([sphere, box], scene, {
            mcount: { x: 2, y: 3, z: 4 },
            isPickable: true,
        });

        //  mc.toThin();

        const ico = MeshBuilder.CreateIcoSphere("ico", { radius: 129 });

        const ico2 = MeshBuilder.CreateIcoSphere("ico2", { radius: 1 });

        const lc = new LinearCloner([box, sphere, ico2], scene, {
            count: 24,
            offset: 3,
            growth: 1.25,
            P: { x: 48, y: 10, z: 0 },
            R: { x: 0, y: 90, z: 0 },
            S: { x: 1, y: 2, z: 1 },
            iModeRelative: false,
            isPickable: false,
        });

        console.log(lc);

        const lc2 = new LinearCloner([box, ico2], scene, {
            count: 48,
            offset: 3,
            growth: 1.25,
            P: { x: 0, y: 10, z: 148 },
            R: { x: 0, y: 90, z: 0 },
            S: { x: 1, y: 2, z: 1 },
            iModeRelative: false,
            isPickable: false,
        });

        //     lc.toThin();

        //    Animation.CreateAndStartAnimation("ani", lc, "growth", 30, 120, 0, 10);

        const rc = new RadialCloner([box, sphere, ico2], scene, {
            count: 24,
            radius: 12,
            isPickable: true,
        });

        //     rc.toThin(true, "RadCloner");
        //    Animation.CreateAndStartAnimation('radanimation', rc, 'radius', 30, 120, 0, 90);
        //   console.log(mc);

        const box1 = box.clone("box1");
        box1.makeGeometryUnique();
        box1.scaling.scaleInPlace(5);
        box1.bakeCurrentTransformIntoVertices();

        const oc = new ObjectCloner([box], ico, scene, { isPickable: false });

        //     oc.toThin();

        const reff = new RandomEffector();

        reff.scale = { x: 0, y: 2, z: 0 };

        //     rc.addEffector(reff, 1);

        //    mc.addEffector(reff, 1);

        //     oc.addEffector(reff, 1);

        //      lc.addEffector(reff, 1);

        reff.strength = 0.5;
        reff.updateClients();

        //    bbb(lc);

        //  let thinLC = lc.toThin();

        //  console.log(thinLC);
        /*
        console.log(lc._clones);
        console.log(typeof lc);

        let isource: Mesh;
        let scal, rot, pos;

        lc._clones.forEach((c) => {
            let inst = c.getChildren()[0] as InstancedMesh;
            pos = c.position;
            rot = Quaternion.FromEulerVector(inst.rotation);
            scal = inst.scaling;
            //  console.log(scal, rot, pos);
            isource = inst.sourceMesh;
            inst.sourceMesh.setEnabled(true);
            let matrix = Matrix.Compose(scal, rot, pos);
            inst.sourceMesh.thinInstanceAdd(matrix);
        });

        setTimeout(() => {
            // isource.setEnabled(false);
            lc.delete();
        }, 4000);

        */

        return scene;
    };
}

export default new DefaultSceneWithTexture();
