/**
 * 编译项目
 */
const rollup = require('rollup');

let version = require('./package.json').version;
let banner =
`/**
 * cropper image
 *
 * @version ${version}
 */`;

async function build() {
    // main
    const bundle = await rollup.rollup({
        input: './src/index.js'
    });
    
    await bundle.write({
        banner: banner,
        format: 'umd',
        name: 'CanvasImageCropper',
        file: 'index.js'
    });
}

// run
build();