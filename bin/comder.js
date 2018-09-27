#!/usr/bin/env node

let program = require('commander');
let package = require('../package.json')
const compress = require("../lib/compress");

program.version('v' + package.version)
    .description('基于Tinypng的图片压缩功能')
// program
//     .option('-s, --source', '源文件目录')
//     .option('-t, --target', '目标文件目录')
    
program
    .command('path <source> [target]')
    .description('配置源文件目录以及目标文件目录')
    .action(function (source, target) {
        compress(source, target)
        
    });

program.parse(process.argv)
// console.log('process', process)
// console.log('program.args',program.args)
if (program.source) console.log('  - source');
if (program.target) console.log('  - target');



if (program.args.length === 0) {
    program.help()
}