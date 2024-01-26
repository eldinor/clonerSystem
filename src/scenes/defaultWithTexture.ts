import { Engine } from "@babylonjs/core/Engines/engine";
import { Scene } from "@babylonjs/core/scene";
import { ArcRotateCamera } from "@babylonjs/core/Cameras/arcRotateCamera";
import { Vector3 } from "@babylonjs/core/Maths/math.vector";
import { StandardMaterial } from "@babylonjs/core/Materials/standardMaterial";
import { CreateSceneClass } from "../createScene";

// If you don't need the standard material you will still need to import it since the scene requires it.
// import "@babylonjs/core/Materials/standardMaterial";
import { Texture } from "@babylonjs/core/Materials/Textures/texture";

import grassTextureUrl from "../../assets/grass.jpg";
import { DirectionalLight } from "@babylonjs/core/Lights/directionalLight";

import "@babylonjs/core/Lights/Shadows/shadowGeneratorSceneComponent";
import "@babylonjs/core/Culling/ray";
import { MeshBuilder } from "@babylonjs/core/Meshes/meshBuilder";
import {
    MatrixCloner,
    LinearCloner,
    RadialCloner,
    ObjectCloner,
    RandomEffector,
} from "../clonerSystem";
import { PBRMaterial } from "@babylonjs/core/Materials/PBR/pbrMaterial";
import roomEnvironment from "../../assets/environment/room.env";
import { CubeTexture } from "@babylonjs/core/Materials/Textures/";
import { Color3 } from "@babylonjs/core/Maths/math.color";

export class DefaultSceneWithTexture implements CreateSceneClass {
    createScene = async (
        engine: Engine,
        canvas: HTMLCanvasElement
    ): Promise<Scene> => {
        // This creates a basic Babylon Scene object (non-mesh)
        const scene = new Scene(engine);
        scene.environmentTexture = new CubeTexture(roomEnvironment, scene);
        // Uncomment to load the inspector (debugging) asynchronously

        // void Promise.all([
        //     import("@babylonjs/core/Debug/debugLayer"),
        //     import("@babylonjs/inspector"),
        // ]).then((_values) => {
        //     console.log(_values);
        //     scene.debugLayer.show({
        //         handleResize: true,
        //         overlay: true,
        //         globalRoot: document.getElementById("#root") || undefined,
        //     });
        // });

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

        const light = new DirectionalLight(
            "light",
            new Vector3(0, -1, 1),
            scene
        );
        light.intensity = 0.2;
        light.position.y = 10;

        const pbr = new PBRMaterial("pbr", scene);

        pbr.metallic = 0.0;
        pbr.roughness = 0;

        pbr.subSurface.isRefractionEnabled = true;
        pbr.subSurface.indexOfRefraction = 2.1;

        const pbrGreen = new PBRMaterial("pbrGreen", scene);
        pbrGreen.metallic = 0.0;
        pbrGreen.roughness = 0.5;
        pbrGreen.albedoColor = Color3.Green();

        const pbrRed = new PBRMaterial("pbrGreen", scene);
        pbrRed.metallic = 0.0;
        pbrRed.roughness = 0.5;
        pbrRed.albedoColor = Color3.Red();

        const box = MeshBuilder.CreateBox("box");

        const sphere = MeshBuilder.CreateSphere(
            "sphere",
            { diameter: 2, segments: 32 },
            scene
        );

        box.material = pbr;
        sphere.material = pbrRed;

        const mc = new MatrixCloner([sphere, box], scene, {
            mcount: { x: 2, y: 3, z: 4 },
            isPickable: true,
        });

        //  mc.toThin();

        const ico = MeshBuilder.CreateIcoSphere("ico", { radius: 129 });

        const ico2 = MeshBuilder.CreateIcoSphere("ico2", { radius: 1 });

        ico2.material = pbrGreen;

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

        //

        return scene;
    };
}

export default new DefaultSceneWithTexture();
