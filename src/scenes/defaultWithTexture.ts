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
import { HemisphericLight } from "@babylonjs/core/Lights/hemisphericLight";
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

import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import { Cloner } from "../externals/core";

import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";

import { Color3 } from "@babylonjs/core/Maths/math.color";

import { VertexBuffer } from "@babylonjs/core/Buffers/buffer";

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
            { diameter: 1, segments: 32 },
            scene
        );

        const light = new HemisphericLight("hemi", Vector3.Up(), scene);
        light.intensity = 0.6;

        //   sphere.position.y = 1;
        sphere.position.y = 1;
        sphere.scaling.z = 1.5;
        sphere.bakeCurrentTransformIntoVertices();

        sphere.material = new StandardMaterial("sphere material", scene);
        (sphere.material as StandardMaterial).diffuseColor = Color3.Teal();
        // Our built-in 'ground' shape.
        /*
        const ground = CreateGround("ground", { width: 6, height: 6 }, scene);


        // Load a texture to be used as the ground material
        const groundMaterial = new StandardMaterial("ground material", scene);
        groundMaterial.diffuseTexture = new Texture(grassTextureUrl, scene);

        /*
        const ground = CreateGround("ground", { width: 6, height: 6 }, scene);
        ground.material = groundMaterial;
        ground.receiveShadows = true;
      */
        const hemiLight = new HemisphericLight(
            "hemi",
            new Vector3(0, 1, 0),
            scene
        );
        hemiLight.intensity = 0.7;

        /*
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


        const ico = CreateIcoSphere("ico", { radius: 2, subdivisions: 4 });

        const box = CreateBox("box", { width: 0.5, height: 0.2 });
        box.material = new StandardMaterial("box material", scene);
        (box.material as StandardMaterial).diffuseColor = Color3.Green();

        const capsule = CreateCapsule("caps");
        capsule.material = new StandardMaterial("capsule material", scene);
        (capsule.material as StandardMaterial).diffuseColor = Color3.Red();

        const rr = new RandomEffector();
        rr.strength = 1;
        rr.position = { x: 2, y: 0, z: 2 };
        rr.rotation = { x: 70, y: 30, z: 0 };

        const rc = new ClonerSystem.RadialCloner(
            [sphere, box, capsule],
            scene,
            {
                count: 24,
                radius: 8,
            }
        );

        rc.addEffector(rr, 1);

        const lc = new LinearCloner([box, sphere, capsule], scene, {
            iModeRelative: true,

            count: 30,
            P: { x: 2, y: 0, z: -1 },
        });

        lc.addEffector(rr, 1);

        const box1 = CreateBox("box1", { width: 0.3, depth: 0.1, height: 0.2 });
        box1.material = new StandardMaterial("box1 material", scene);
        (box1.material as StandardMaterial).diffuseColor = Color3.Yellow();

        const oc = new ObjectCloner([box1], ico, scene, {});
        //  oc.addEffector(rr, 3);

        const reff = new RandomEffector();

        reff.position = { x: 2, y: 2, z: 2 };
        reff.strength = 3;

        oc.addEffector(reff, 1);
        oc.addEffector(rr, 1);

        const box2 = CreateBox("box2", { width: 2, depth: 1, height: 0.5 });

        const mc = new MatrixCloner([capsule, box2, sphere], scene, {
            mcount: { x: 5, y: 5, z: 15 },
        });

        mc.root!.position = new Vector3(-10, 0, 15);
        mc.addEffector(rr, 1);

        console.log(mc.root!.getChildren());


        //  let instanceCount = mc.root?.getChildren().length;
        /*
        mc.root?.getChildMeshes().forEach((m) => {
            console.log(m.getClassName());
        });

        let inst = mc.root
            ?.getChildMeshes()
            .filter((m) => m.getClassName().includes("Instanced"));
        console.log(inst);

        let instBox = inst!.filter((m) => m.name.includes("box"));
        console.log(instBox);

        let instanceCount = instBox.length;
        let colorData = new Float32Array(4 * instanceCount!);

        for (let index = 0; index < instanceCount!; index++) {
            colorData[index * 4] = Math.random();
            colorData[index * 4 + 1] = Math.random();
            colorData[index * 4 + 2] = Math.random();
            colorData[index * 4 + 3] = 1.0;
        }

        const buffer = new VertexBuffer(
            engine,
            colorData,
            VertexBuffer.ColorKind,
            false,
            false,
            4,
            true
        );

        box2.material = new StandardMaterial("material");
        (box2.material as StandardMaterial).disableLighting = true;
        (box2.material as StandardMaterial).emissiveColor = Color3.White();
        box2.setVerticesBuffer(buffer);
        box2.alwaysSelectAsActiveMesh = true;

        mc.root?.getChildren().forEach((m) => {
            (m as any).alwaysSelectAsActiveMesh = true;
        });
*/
        //#######################################################################33
        /*
        var mc = new MatrixCloner([capsule, box, sphere], scene, {
            mcount: { x: 5, y: 5, z: 5 },
            useInstances: true,
        });



        mc.addEffector(rr, 1);
*/
        //######################################################################################

        //
        /*
        setTimeout(() => {
            console.log("DELETED");
            mc.delete();
        }, 5000);

        /*
        const gc = new MatrixCloner([mc as any], scene, {
            mcount: { x: 2, y: 2, z: 2 },
        });

        //@ts-ignore
        mc.root!.position = new Vector3(10, 0, 0);
        //@ts-ignore
        mc._rootNode.scaling = new Vector3(0.2, 0.2, 0.2);
        //    const ccc = new Cloner();
        //  console.log(ccc);
        /*
        const rc = new RadialCloner([sphere, box] as any, scene, {
            count: 12,
            radius: 12,
        });

        //
        //
       
        var rr = new RandomEffector();
        rr.strength = 1;
        rr.position = { x: 2, y: 0, z: 2 };
        rr.rotation = { x: 0, y: 30, z: 0 };

        var reff = new RandomEffector();
        //@ts-ignore
        reff.scale = { x: 1, y: 0, z: 0, u: true };
        reff.strength = 1;
        var animate = true;

        var box1 = CreateBox("box1", { size: 0.2 });
        box1.material = new StandardMaterial("box1 material", scene);
        (box1.material as StandardMaterial).diffuseColor = Color3.Yellow();

        const rc = new RadialCloner([sphere, box] as any, scene, {
            count: 12,
            radius: 12,
        });

        rc.addEffector(rr, 1);
        /*

                var mc = new MatrixCloner([capsule] as any, scene, {
            mcount: { x: 5, y: 5, z: 5 },
        });

        
        const lc = new LinearCloner([box, sphere, capsule] as any, scene, {
            iModeRelative: true,
            //@ts-ignore
            count: 30,
            P: { x: 2, y: 0, z: -1 },
        });

        lc.addEffector(rr, 1);
        var sph1 = MeshBuilder.CreateTorusKnot(
            "tk",
            {
                radialSegments: 16,
                tubularSegments: 16,
                radius: 12,
                tube: 2,
                p: 1,
                q: 2,
            },
            scene
        );

        const oc = new ObjectCloner([box1], sph1, scene, {});
        oc.addEffector(reff, 0);
       
        //@ts-ignore
        Animation.CreateAndStartAnimation(
            "radanimation",
            rc,
            "radius",
            30,
            30,
            0,
            10,
            Animation.ANIMATIONLOOPMODE_CONSTANT
        );
*/
        return scene;
    };
}

export default new DefaultSceneWithTexture();

function bbb(cSystem: Cloner) {
    console.log("bbb", cSystem);
}
