# compressPng
>   前端线上自动化图片压缩工具，基于[`tinypng`][2]接口开发，通过命令行控制

[2]: https://tinypng.com/developers   "tinypng.com"


### 一，Quick Start
1,全局安装compresspng
```javascript
npm i compresspng -g
```
2,打开shell窗口，输入cpng 命令
```javascript
cpng  //查看帮助

cpng path <源目录路径> [目标路径]
```

### 二，说明
1. 建议全局安装，安装之后可以随时通过shell压缩图片，并拷贝非图片文件。
2. 当目录路径是相对路径时，相对于当前命令窗口。
3. 可以放在package.json里使用，避免重复输入。例如：
```json
"scripts": {

    "img": "cpng path .\\res\\"
  }
```
4. 只有源目录路径一个参数时，或者源路径与目标路径相同时，默认覆盖当前文件，不拷贝非图片文件。
5. 在源目录路径下生成compressed.log文件，用来记录当前目录图片压缩状态。
6. 已经压缩过一次之后，想在源目录路径下压缩图片覆盖源文件，请先手动删除compressed.log文件，反之同理。除此之外，为了避免不必要的压缩开销，请不要随意删除。
