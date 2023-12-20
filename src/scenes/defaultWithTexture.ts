import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
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

import { CreateBox } from "@babylonjs/core/Meshes/Builders/boxBuilder";
import { CreateCapsule } from "@babylonjs/core/Meshes/Builders/capsuleBuilder";

import { Animation, CreateIcoSphere, MeshBuilder } from "@babylonjs/core/";
import { Color3 } from "@babylonjs/core/Maths/math.color";

import { RandomEffector } from "../clonersystem";
import { RadialCloner } from "../clonersystem";
import { MatrixCloner } from "../clonersystem";
import { LinearCloner } from "../clonersystem";
import { ObjectCloner } from "../clonersystem";

import { ClonerSystem } from "../clonersystem";

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

        // Move the sphere upward 1/2 its height
        sphere.position.y = 1;
        sphere.scaling.z = 1.5;
        sphere.bakeCurrentTransformIntoVertices();

        sphere.material = new StandardMaterial("sphere material", scene);
        (sphere.material as StandardMaterial).diffuseColor = Color3.Teal();
        // Our built-in 'ground' shape.

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
            [sphere, box, capsule] as any,
            scene,
            {
                count: 24,
                radius: 8,
            }
        );

        rc.addEffector(rr, 1);

        const lc = new LinearCloner([box, sphere, capsule] as any, scene, {
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

        const mc = new MatrixCloner([capsule, box, sphere], scene, {
            mcount: { x: 5, y: 5, z: 5 },
        });

        mc.root!.position = new Vector3(-10, 0, 15);
        mc.addEffector(rr, 1);

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
