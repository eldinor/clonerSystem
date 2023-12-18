# clonerSystem

## Cloner System for Babylon.js

Based on Cloner System extension https://github.com/BabylonJS/Extensions/tree/master/ClonerSystem by https://github.com/androdlang

More info and docs here - https://doc.babylonjs.com/communityExtensions/clonerSystem

Definitions:

<ul><li>
		Cloners: given one or several meshes, either clones or instances will distributed in a specific manner. If more than one mesh is provided, the meshes are distributed alternatively. Additionally, cloners can be nested, so it is possible to clone cloners. Each cloner can have several Effectors (in particular order) to influence the Scale/Position/Rotation parameter of a clone (or cloner). A sensitivity parameter controls this influence for a cloner. Following Objects are designated:
	</li>
	<li>
		RadialCloner: radial distribution where following parameters are recognized: input-meshlist, count, radius, offset, startangle, endangle, Effector-sensitivity for Position, Scale and Rotation, alignment-flag, orientation.
	</li>
	<li>
		LinearCloner: linear distribution where following parameters are recognized: input-meshlist, count, offset, growth, Effector-sensitivity for Position, Scale and Rotation. An interpolation-mode-flag&nbsp; determines, if the clone -parameters (Scale/Position/Rotation) are interpreted as "step" or "end"-values.
	</li>
	<li>
		MatrixCloner: distribution in 3D space where following parameters are recognized: input-meshlist, mcount, size.
	</li>
	<li>
		ObjectCloner: distribution over faces of a mesh where following parameters are recognized: input-meshlist, reference-mesh.
	</li>
	<li>
		RandomEffector: influences Scale/Position/Rotation of a clone with repeatable random values, controlled with an overall "strength" parameter. Not quite finished, but basically working.
	</li>
</ul>

## Demo

The demo with all cloners - https://babylonpress.org/cloner/

## Import and Usage

Import is done through src/clonersystem/index.ts.
You may import the whole ClonerSystem and then use like ClonerSystem.MatrixCloner etc.
Or, for better tree shaking, import them like <br><pre>import { RandomEffector } from "../clonersystem";<br>import { MatrixCloner } from "../clonersystem"</pre>

Then use like

<pre>

        const mc = new MatrixCloner([capsule, box, sphere], scene, {
            mcount: { x: 5, y: 5, z: 5 },
        });

        mc.root!.position = new Vector3(-10, 0, 15);
		const rr = new RandomEffector();
        rr.strength = 1;
        rr.position = { x: 2, y: 0, z: 2 };
        rr.rotation = { x: 70, y: 30, z: 0 };
        mc.addEffector(rr, 1);</pre>

## Getting started

This is a Babylon.js project using typescript, latest babylon.js es6 core module, webpack 4 with webpack dev server, hot loading, eslint, vscode support and more.

To run the basic scene:

1. Clone / download this repository
2. run `npm install` to install the needed dependencies.
3. run `npm start`
4. A new window should open in your default browser. if it doesn't, open `http://localhost:8080`

Running `npm start` will start the webpack dev server with hot-reloading turned on. Open your favorite editor (mine is VSCode, but you can use nano. we don't discriminate) and start editing.

The entry point for the entire TypeScript application is `./src/index.ts`. Any other file imported in this file will be included in the build.

To debug, open the browser's dev tool. Source maps are ready to be used. In case you are using VSCode, simply run the default debugger task (`Launch Chrome against localhost`) while making sure `npm start` is still running. This will allow you to debug your application straight in your editor.

## Loading different examples

The `./src/scenes` directory contains a few examples of scenes that can be loaded. To load a different scene change the import in `./src/createScene.ts` to the scene you want to load.

More and more scenes will be slowly added.

Note - the build process will be very slow if you keep all scenes for production. To speed up the build process, remove all scenes except for the one you want to build.

## WebGPU? yes please

Open the URL in a webgpu-enabled browser and add "?engine=webgpu" to the URL. If you want to add a different scene, add it as a query parameter: `http://localhost:8080/?scene=physicsWithAmmo&engine=webgpu`.

## What else can I do

To lint your source code run `npm run lint`

To build the bundle in order to host it, run `npm run build`. This will bundle your code in production mode, meaning is will minify the code.

Building will take some time, as it will build each sample (and create a different module for each). If you want to speed up the process, define the scene you want to render in `createScene.ts` (you can see the comment there)

## What is covered

-   Latest typescript version
-   Simple texture loading (using url-loader)
-   dev-server will start on command (webpack-dev-server)
-   A working core-only example of babylon
-   Full debugging with any browser AND VS Code
-   (production) bundle builder.
-   eslint default typescript rules integrated
