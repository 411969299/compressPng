const crypto = require("crypto")
const tinify = require("tinify");
const path = require("path");
const fs = require("fs");
const util = require("util")
const readFile = util.promisify(fs.readFile)
const copyFile = util.promisify(fs.copyFile)
const appendFile = util.promisify(fs.appendFile)
const fsStat = util.promisify(fs.stat)
const unlink = util.promisify(fs.unlink)
const writeFile = util.promisify(fs.writeFile)
const log = console.log

const API_LIMIT_NUM = 499
const LOGNAME = 'compressed.log'

let keys = ['D9H0iBXxHLs84bR4rLLokEucDJ_Z1MO9', "NqGVDwMO4X298OuSg1BtHKbfzHrQpEjg", "PQqOGwl01Bo35D6kYlbpow4HRU1nGbnr", "pJmOZb6dNughaTRmIz5cXuY0dyTg60B0", "6ZxePUGZaEQBE1HNJjVWpXU004zQuW6J",'f1Fp_EJ-Y_cLaOXwhVicYj8HOhIvae3A']
//0 eors  3 1145154825


class CompressImg {

    constructor(_path) {
        this.sourcePath = ''  //源目录 绝对路径
        this.targetPath = ''  //目标目录 绝对路径
        this.issame = false  //路径是否相同

        this.bencompressed = ''
        this.bencompressed_temp = ''

        this.nowkey = 0
        this.allImgFiles = []  //存储全部图片文件 信息
        this.otherFiles = []  //存储非图片文件
    }

    scanning() {  //扫描目录获取全部信息

    
        let reg = /\.jpg|\.jpeg|\.png/i;
        let me = this

        let append = function (src) {            

            let lstatSync = fs.lstatSync(src),
                status = lstatSync.isDirectory();

            if (!status) {// 如果是文件
                if (src.search(LOGNAME) !== -1) {
                    //排除log文件
                    return false
                }
                
                let item = {
                    oldsrc: src, //源文件路径
                    newsrc: '',//目标路径
                    relativePath: '' //源文件相对路径
                    //md5
                }
                
                item.relativePath = src.replace(me.sourcePath, '.')
                if (me.issame) {
                    item.newsrc = src
                } else {
                    item.newsrc = src.replace(me.sourcePath,me.targetPath)
                }
                

                if (src.match(reg)) {
                    me.allImgFiles.push(item);
                } else {
                    me.otherFiles.push(item);
                }                
                
            }
            
        };
        let recursive = function (resolve) {
            try {
                let files = fs.readdirSync(resolve);

                for (let i = 0, length = files.length; i < length; i++) {
                    let itempath = files[i];//文件名称

                    let Directory = path.join(resolve, itempath);//文件绝对路径
                    //判断是否是文件夹
                    let lstatSync = fs.lstatSync(Directory),
                        status = lstatSync.isDirectory();

                    // 如果是文件夹
                    if (status) {
                        //递归 循环
                        recursive(Directory, itempath);
                    } else {
                        append(path.join(resolve, itempath));

                    }
                }
            }
            catch (e) {
                append(resolve);
            }
        };
        this.sourcePath !== '' && recursive(this.sourcePath);        
        
        return me
    }
    
    chunk(arr, n) {
        if (Array.isArray(arr)) {
            let i = 0, temp = [], j = arr.length / n
            for (; temp.length < j; temp[i++] = arr.splice(0, n));
            return temp;
        }
    }
    equals(a, b) {
        
        if (a.length !== b.length) {
            return false;
        }
        if (a.length === 0) {
            return false;
        }

        for (let i = 0, l = a.length; i < l; i++) {
            if (a[i].md5 + a[i].relativePath !== b[i].md5 + b[i].relativePath) {
                return false
            }            
        }

        return true;
            
    }
    createDirectory(src) {
        //如果不存在则创建目录,src必须是目标目录
        if (src && !this.issame) {
            //let src = obj.newsrc
            let fpathArr = src.replace(this.targetPath, '').split('\\') // 头尾没用
            //console.log(fpathArr)
            let cpath = this.targetPath + '\\';
            try {
                 fs.statSync(cpath)

            } catch (error) {
                fs.mkdirSync(cpath)
            }
            for (let i = 1; i < fpathArr.length - 1; i++) {

                cpath += fpathArr[i] + '\\'
                try {
                    let obj = fs.statSync(cpath)

                } catch (error) {
                    fs.mkdirSync(cpath)
                }
            }
        }
        return this

    }
    async copyFileFun(src) {  //覆盖文件

        let imgarr = Array.isArray(this) ? this : Array.isArray(src) ? src : []

        if (imgarr.length > 0) {
            console.log('开始copy非图片文件')
            for (let i = 0; i < imgarr.length; i++) {
                if (imgarr[i].oldsrc && imgarr[i].newsrc) {

                    this.createDirectory(imgarr[i].newsrc)
                    await copyFile(imgarr[i].oldsrc, imgarr[i].newsrc)
                }

            }
            console.log('copy文件完成，总共copy' + imgarr.length + '个文件')

        }

    }
    async checkBrokenFiles(af) {//目标文件是否有压缩后损坏的        

        if (af.length > 0) {
            let imgArr = []
            console.log('检测是否有文件损坏')
            for (let i = 0; i < af.length; i++) {
                await fsStat(af[i].newsrc)
                    .then((d) => {
                        if (d.size <= 0) {
                            imgArr.push(af[i])
                        }
                    })
                    .catch((e) => {
                        console.log(e)
                    })

            }
            if (this.equals(imgArr, af)) {
                    console.log('停止检测 防止死循环 , 请手动检查以下数据：')
                    console.log(imgArr)
                    return false
                // limit++
                // if (limit > 2) {
                //     console.log('停止检测 防止死循环 , 请手动检查以下数据')
                //     console.log(imgArr)
                //     limit = 0
                //     return false
                // }
            }
            
            if (imgArr.length > 0) {
                console.log('有文件损坏 重新压缩...')
                let [...imgArr_copy] = imgArr
                await this.tinifyImg(imgArr)
                await appendFile(this.sourcePath + '\\' + LOGNAME, this.bencompressed_temp, function (err) {
                    if (err) {
                        console.log(err, 'appendFileERR')
                    } else {
                        //console.log('aaaaaaa')
                    }
                }).then((d) => {
                    this.bencompressed_temp = ''
                })
                console.log('继续检测...')
                await this.checkBrokenFiles(imgArr_copy)
            } else {
                console.log('检测完成 没有文件损坏')
            }

        }        
    }
    async clearFiles() { //源文件是否有删除的
        let af = this.allImgFiles        
        if (this.bencompressed !== '' && af.length > 0) {
            let words = this.bencompressed.split(',')
            let textcatch = this.bencompressed
            
            for (let i = 0; i < words.length; i++){
                if (words[i] !== '') {
                    let file = words[i].split(':')
                    let spath = path.resolve(this.sourcePath, file[1]);
                    let tpath = path.resolve(this.targetPath, file[1]);
                    
                    //og('clearFiles-spath:', spath)
                    await fsStat(spath)
                        .catch(async (e) => {
                            
                            await unlink(tpath).catch((e) => {
                                log('unlink err',e)
                            })
                            
                            this.bencompressed = this.bencompressed.replace(words[i]+',', '')
                                            
                        })
                }
                
            }

            if (textcatch !== this.bencompressed) {
                await writeFile(this.sourcePath + '\\' + LOGNAME, this.bencompressed).catch(async (e) => {
                    console.log(e, '重写log错误')
                })  
                console.log('清理文件完成')
            } else {
                console.log('源目录没有删除文件')
            }          
                    
           

        } else {
            console.log('不需要清理')
        }
    }

    async getMd5(c, i) {  
        let buffer = await readFile(c.oldsrc);
        let md5 = crypto.createHash('md5');
        md5.update(buffer);
        let mymd5 = md5.digest('hex')

        
        if (this.bencompressed.search(new RegExp(mymd5 + ':' + c.relativePath.replace(/\\/g, '\\\\'))) !== -1) {
            //console.log('yes')
        } else {
            c.md5 = mymd5            
        }
        return c

    }    

    async initCompress() {
        if (this.allImgFiles.length <= 0) {
            console.log('没有可压缩的图片 this.allImgFiles = []')
            return this
        }
        let newImgArr = this.allImgFiles.map(this.getMd5.bind(this))
        let arr = []

        for (let i = 0; i < newImgArr.length; i++) {  //筛选 目的是正确显示总数
            let img = await newImgArr[i]
            if (img.md5) {
                arr.push(img) 
                this.createDirectory(img.newsrc);
            }

        }
        if (arr.length <= 0) {
            console.log('没有可压缩的图片 arr = []')
        } else {
            console.log('initCompress Begin')
            await this.tinifyImg(arr).catch((err) => {
                log('this.tinifyImg--err',err)
            })
            await appendFile(this.sourcePath + '\\' + LOGNAME, this.bencompressed_temp, function (err) {
                if (err) {
                    console.log(err, 'appendFileERR')
                } else {
                    //console.log('aaaaaaa')
                }
            }).then((d) => {
                this.bencompressed_temp = ''
            })
            console.log('initCompress End')
            
        }

    }
    tinifyImg(_imgArr) {
        // 并发
        let me = this
        let allLength = _imgArr.length  //总长
        let allArr = this.chunk(_imgArr, 10) //分组不要超过20
        let j = 0

        function compressFiles() {
            let chunkArr = []
            for (let k = 0, len = allArr[j].length; k < len; k++) {
                chunkArr.push(getFiles(allArr[j][k], j,k))
            }
            return Promise.all(chunkArr)
                .then((d) => {                    
                    ++j
                    //console.log(j)
                    if (j < allArr.length) {
                        compressFiles()
                    }
                    
                })
                .catch((err) => {
                    //console.log(err)
                    if (err.status && err.status === 429) {
                        //console.log("me.nowkey == " + me.nowkey)
                        if (me.nowkey + 1 >= keys.length) {
                            throw new Error('没有足够的KEY可用')
                        } else {
                            
                            tinify.key = keys[++me.nowkey];
                            compressFiles()
                        }

                    } else {
                        return new Error(err)
                    }
                })
            
        }
       
   
        // function getFiles(c, _j, _k, _len) {
        //     return new Promise(function (resolve, reject) {
        //         let r = Math.floor((Math.random() * 200) + 100)
        //         setTimeout(resolve, r, 'foo');
        //     }).then(async (d) => {
        //             //console.log(d)
        //             //let imgBasename = me.getRelativePath(urlObj[i].oldsrc)
        //         await appendFile(__dirname + '\\' + '_compressed.log', c.md5 + ':' + c.relativePath + ',', function (err) {
        //                 if (err) {
        //                     console.log(err, 'appendFileERR')
        //                 } else {
        //                     //console.log('aaaaaaa')
        //                 }
        //             });
        //             await console.log((10 * _j + _k + 1) + '/' + allLength)
        //         })

        // }
        function getFiles(c, _j,_k) {
            return tinify.fromFile(c.oldsrc).toFile(c.newsrc)
                .then(async (d) => {
                    
                    if (me.issame) {
                        //console.log('覆盖模式,需要重新计算md5，更改log文件内容')
                        
                        let buffer = await readFile(c.newsrc);
                        let md5 = crypto.createHash('md5');
                        md5.update(buffer);
                        let mymd5 = md5.digest('hex')

                        me.bencompressed_temp += mymd5 + ':' + c.relativePath + ','

                    } else {
                        me.bencompressed_temp += c.md5 + ':' + c.relativePath + ','
                        
                    }
                    
                    await console.log((10 * _j+_k+1) + '/' + allLength)
                })                
             
        }
        return compressFiles()

    }
    

    async init(source, target) {
        
        if (target && source !== target) {
            this.sourcePath = path.resolve(source)
            this.targetPath = path.resolve(target)
        } else {
            this.sourcePath = this.targetPath = path.resolve(source)
            this.issame = true
        }

        log('this.sourcePath::', this.sourcePath)

        
        try {
            this.bencompressed = fs.readFileSync(this.sourcePath + '\\' + LOGNAME, "utf-8")
        } catch (error) {
            this.bencompressed = ''
        }

        tinify.key = keys[this.nowkey]  
        

        this.scanning()


        await this.clearFiles()
        await this.initCompress()
        if (!this.issame) {
            await this.copyFileFun(this.otherFiles)
        }
        this.checkBrokenFiles(this.allImgFiles)
        return false;
        //console.log(tinify.compressionCount)

        //this.clearFiles()//源文件是否有删除的  -d
        //this.checkBrokenFiles(this.allImgFiles)//目标文件是否有压缩后损坏的  -b
    
        switch ('--') {
            case '-d':
                await this.clearFiles()
                break;
            case '-b':
                await this.checkBrokenFiles(this.allImgFiles)
                break;
            case '-c':
                await this.copyFileFun(this.otherFiles)
                break;
            default:
                await this.clearFiles()
                await this.initCompress()
                await this.copyFileFun(this.otherFiles) //copy 非图片文件 -c
                await this.checkBrokenFiles(this.allImgFiles)
        }
       
        
    }
}



module.exports = function (source, target) {
    source && new CompressImg().init(source, target)
}