import os
import re

pathDic = {}
defaultPathDic = {}
classList = []
sxList = []

'''
注意:只有声明了export的class才会被注册进来

export class MyClass1(){//会被注册进来
    ...
}

class MyClass2(){//不会被注册进来
   ...
}


'''


def findTargetInDir(dirPath):
    # print("dirPath =",dirPath)
    list = os.listdir(dirPath)  # 列出文件夹下所有的目录与文件
    for i in range(0, len(list)):
        path = os.path.join(dirPath, list[i])
        path = path.replace("\\", "/")
        file_extension = os.path.splitext(list[i])[1]
        if ".d.ts" in path:  # 忽略.d.ts文件
            continue
        if os.path.isdir(path):  # 这个是文件夹 继续递归向下遍历
            findTargetInDir(path)
        elif file_extension == ".ts":
            file = open(path, "r", encoding="utf-8")
            file.flush()
            read = file.read()
            file.close()
            read = re.sub(r'\'.*?\'', "", read)
            read = re.sub(r'".*?"', "", read)
            read = re.sub(r'`.*?`', "", read)
            read = re.sub(r'\/\/.*', "", read)  # 去除行注释部分 避免把注释掉的 部分也导入进来
            # 去除块注释部分 避免把注释掉的 部分也导入进来
            read = re.sub(r'\/\*(.|\n)*?\*\/', "", read)

            classResult = re.findall('.*export.*class.*', read)

            if classResult:
                # print("import :", path.split(".ts")[0])
                classArr = []
                NS = re.findall(
                    ".*export.*\s+(namespace.*(?=\s*)|module.*(?=\s*)).*?(\n*\{)", read)
                hasNS = len(NS)
                # print("xxxx", len(classResult)) export class CCC
                moduleArr = []
                if NS:
                    for i in range(len(NS)):
                        mStr = NS[i][0]
                        mStr = re.sub(r'namespace', "", mStr)
                        mStr = re.sub(r'module', "", mStr)
                        mStr = re.sub(r' ', "", mStr)
                        # print("namespace =", mStr)
                        moduleArr.append(mStr)
                else:  # 无命名空间
                    sx: str = read.split(" class ")[1].split(
                        " ")[0].split("{")[0].split("\n")[0]
                    sx = sx.replace(" ", "")
                    sxList.append(sx)
                    # print("no ns",sx)

                for i in range(len(classResult)):
                    default = False
                    if classResult[i].find(" default ") > -1:
                        default = True
                    ss: str = classResult[i].split(" class ")[1]

                    ss = ' '.join(ss.split())  # 把多个空格合并成一个
                    ss.replace("{", "")

                    ss = ss.split(" ")[0]

                    if ss != "":
                        if hasNS == 0:
                            if default:
                                defaultPathDic[ss] = path.split(".ts")[0]
                            else:
                                pathDic[ss] = path.split(".ts")[0]

                        elif hasNS > 0:
                            # print("ns class =",ss)
                            nsClassHandle(read, moduleArr, ss, path)
                        classArr.append(ss)
            else:
                pass


def nsClassHandle(read, moduleArr, cls: str, filePath: str):
    # print("xxxx =",moduleArr, cls)
    pathObj = {}
    path = ""
    _cls = cls
    cls = cls.replace("$", "\$")
    for key in range(len(moduleArr)):
        # print(moduleArr[key], cls)
        # print(re.match(r'+moduleArr[key]}',read))

        result = re.findall(moduleArr[key]+"(?:.|\n)*?"+cls, read)

        if len(result) > 0:
            r1 = result[0]
            l = len(r1.split("{")) - 1
            r = len(r1.split("}")) - 1
            if l > r:
                pathObj[l-r] = moduleArr[key]

    # print("pathObj =",pathObj,_cls)

    for k in pathObj:
        path += pathObj[k] + "."

    classList.append(path + _cls)
    pathDic[(path + _cls).split(".")[0]] = filePath.split(".ts")[0]
    if path != "":
        print("class in namespace(module) =", path + _cls)


findTargetInDir("./assets/script")

newfile = open("./assets/script/ClassDictionary.ts", "w", encoding="utf-8")

pathList = []
for key in pathDic:
    pathList.append(key)

pathList.sort()


group = {}
for i in range(len(pathList)):
    # print("key =",key)
    key = pathList[i]
    _path = pathDic[key].split("./assets/")[1]

    if _path not in group:
        group[_path] = []
    group[_path].append(key)

for _path in group:
    index = 0
    _str = group[_path][index]
    if _str == "ClassDictionary":
        if len(group[_path]) > 1:
            _str = group[_path][1]
            index = 1
        else:
            continue
    for i in range(index + 1, len(group[_path])):
        if group[_path][i] == "ClassDictionary":
            continue
        _str += ", " + group[_path][i]

    print("import { " + _str + " } from \"./../" + _path + "\"")
    newfile.write("import { " + _str + " } from \"./../" + _path + "\";\n")

newfile.write("\n")

pathList = []
for key in defaultPathDic:
    classList.append(key)
    pathList.append(key)

pathList.sort()

for i in range(len(pathList)):
    key = pathList[i]
    _path = defaultPathDic[key].split("./assets/")[1]
    print("import " + key + " from \"./../" + _path + "\"")
    newfile.write("import " + key + " from \"./../" + _path + "\";\n")

newfile.write("\n" +
              "export class ClassDictionary {\n" +
              "\tpublic static classDic: { [key: string]: any } = {};\n" +
              "\t/**\n" +
              "\t * 获得一个实例或Class的类型名称\n" +
              "\t * \n" +
              "\t */\n" +
              "\tpublic static getClassNameByTarget(anyObj: any): string {\n" +
              "\t\tif (!anyObj) {\n" +
              "\t\t\tlet proto = Object.prototype.toString.call(anyObj).split(" ")[1].split(\"]\")[0];\n" +
              "\t\t\treturn proto;\n" +
              "\t\t}\n" +
              "\t\tif (anyObj) {\n" +
              "\t\t\t//anyObj非空时 有 [\"__class__\"] 的是实例 否则是一个Class\n" +
              "\t\t\tif (anyObj.prototype && anyObj.prototype[\"__classname__\"]) return anyObj.prototype[\"__classname__\"];//Class\n" +
              "\t\t\tif (anyObj.prototype && anyObj.prototype[\"__class__\"]) return anyObj.prototype[\"__class__\"];//Class\n" +
              "\t\t\tif (anyObj.prototype && anyObj.prototype[\"constructor\"]) return anyObj.prototype[\"constructor\"].name;//Class\n" +
              "\t\t\tif (anyObj[\"constructor\"] && anyObj[\"constructor\"].name) return anyObj[\"constructor\"].name;//实例\n" +
              "\t\t\tif (anyObj.name) return anyObj.name;//Class\n" +
              "\t\t\tif (anyObj[\"__classname__\"]) return anyObj[\"__classname__\"];//实例\n" +
              "\t\t\tif (anyObj[\"__class__\"]) return anyObj[\"__class__\"];//实例\n" +
              "\t\t\tif (anyObj[\"__proto__\"] && anyObj[\"__proto__\"].name) return anyObj[\"__proto__\"].name;//实例   \n" +
              "\t\t}\n" +

              "\t\tlet str = Object.prototype.toLocaleString.call(anyObj);\n" +
              "\t\tlet str1: string = str.split(" ")[1];\n" +
              "\t\treturn str1.split(\"]\")[0];\n" +
              "\t}\n\n" +
              "\t/**\n" +
              "\t * 获得项目里一个实例的原类型引用 可以用来创建实例 或比较类型\n" +
              "\t * @example\n" +
              "\t * 1\n" +
              "\t * var node:Texture2D = new Texture2D();\n" +
              "\t * var cls = ClassDictionary.getClassByTarget(node);//返回 Texture2D\n" +
              "\t * var node2:cls = new cls();\n" +
              "\t * \n" +
              "\t * 2\n" +
              "\t * var a:Sprite = new Sprite();\n" +
              "\t * var b:Button = new Button();\n" +
              "\t * if(ClassDictionary.getClassByTarget(a) == ClassDictionary.getClassByTarget(b)){\n" +
              "\t * 	......\n" +
              "\t * }\n" +
              "\t * \n" +
              "\t */\n" +
              "\tpublic static getClassByTarget<T>(anyObj: T): new (...args) => T {\n" +
              "\t\tif (anyObj === null || anyObj === undefined) {//0 或 boolean 都会返回类型\n" +
              "\t\t\treturn null;\n" +
              "\t\t}\n" +
              "\t\tif (typeof anyObj == \"function\") {\n" +
              "\t\t\treturn <any>anyObj;\n" +
              "\t\t}\n" +
              "\t\treturn <any>anyObj[\"constructor\"];\n" +
              "\t}\n" +
              "}\n\n"
              )


classList.sort()
for i in range(len(classList)):
    key = classList[i]
    if (key in sxList) == False:
        sxList.append(key)


sxList.sort()
for i in range(len(sxList)):
    key = sxList[i]
    if key == "ClassDictionary":
        continue
    newfile.write("ClassDictionary.classDic[\"" + key + "\"] = " + key + ";\n")


newfile.close()


input("")
