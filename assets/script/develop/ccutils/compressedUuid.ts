import { DEBUG } from "cc/env";

const BASE64_VALUES = [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 62, 64, 64, 64, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61, 64, 64, 64, 64, 64, 64, 64, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 64, 64, 64, 64, 64, 64, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51];

const shotArr = Array.from(new Set(BASE64_VALUES));//数组删除重复元素(去重)

const separator = '@';

const HexChars = '0123456789abcdef'.split('');
if (DEBUG) {
    window["BASE64_VALUES"] = BASE64_VALUES;
    window["HexChars"] = HexChars;
    window["shotArr"] = shotArr;
}

const _t = ['', '', '', ''];
const decodeUuidTemplate = _t.concat(_t, '-', _t, '-', _t, '-', _t, '-', _t, _t, _t);
const Indices = decodeUuidTemplate.map((x, i) => (x === '-' ? NaN : i)).filter(Number.isFinite);



const compressedUuidTemplate = [];

//creator 3.x 压缩uuid算法   36转22
export function compressedUuid(base64: string):string {
    if (base64.split(separator)[0].length !== 36) {
        return base64;
    }
    //"8c5b9bb2-a1c9-421f-a1b2-770e30b889f6@xxxxx" 这种格式一般是   纹理集@子图
    base64 = base64.replace(/-/g, "");//把所有"-"都去掉
    let strs = base64.split(separator);
    base64 = strs[0];//截取"@"字符的前段
    

    compressedUuidTemplate.length = 0;
    compressedUuidTemplate[0] = base64[0];
    compressedUuidTemplate[1] = base64[1];
    //71ccf2cf-1a76-40b6-950d-b55b543e0b28  71zPLPGnZAtpUNtVtUPgso
    for (let i = 2; i < base64.length; i += 3) {
        let a = HexChars.indexOf(base64[i]);
        recycling: for (let x = a << 2; x < (a << 2) + 4; x++) {
            if (BASE64_VALUES.indexOf(x) == 0) {
                continue;
            }
            for (let y = 0; y < shotArr.length; y++) {
                if (BASE64_VALUES.indexOf(shotArr[y]) == 0) {
                    continue;
                }
                if (HexChars[x >> 2] == base64[i] && HexChars[((x & 3) << 2) | shotArr[y] >> 4] == base64[i + 1] && HexChars[shotArr[y] & 0xF] == base64[i + 2]) {
                    //console.log(x,y,String.fromCharCode(BASE64_VALUES.indexOf(x)), String.fromCharCode(BASE64_VALUES.indexOf(shotArr[y])));
                    compressedUuidTemplate[compressedUuidTemplate.length] = String.fromCharCode(BASE64_VALUES.indexOf(x));
                    compressedUuidTemplate[compressedUuidTemplate.length] = String.fromCharCode(BASE64_VALUES.indexOf(shotArr[y]));
                    break recycling;
                }
            }
        }
    }
    return !!strs[1] ? compressedUuidTemplate.join('') + separator + strs[1] : compressedUuidTemplate.join('');
}

////creator 3.x 解压缩uuid算法    22转36
export function decodeUuid(base64: string):string {
    //"8cW5uyoclCH6Gydw4wuIn2@xxxxx" 这种格式uuid一般是   纹理集@子图
    const strs = base64.split(separator);
    const uuid = strs[0];
    if (uuid.length !== 22) {
        return base64;
    }
    decodeUuidTemplate[0] = base64[0];
    decodeUuidTemplate[1] = base64[1];
    for (let i = 2, j = 2; i < 22; i += 2) {
        const lhs = BASE64_VALUES[base64.charCodeAt(i)];
        const rhs = BASE64_VALUES[base64.charCodeAt(i + 1)];
        decodeUuidTemplate[Indices[j++]] = HexChars[lhs >> 2];
        decodeUuidTemplate[Indices[j++]] = HexChars[((lhs & 3) << 2) | rhs >> 4];
        decodeUuidTemplate[Indices[j++]] = HexChars[rhs & 0xF];
    }
    return base64.replace(uuid, decodeUuidTemplate.join(''));
}


if (DEBUG) {
    window["did"] = window["decodeUuid"] = decodeUuid;
    window["cid"] = window["compressedUuid"] = compressedUuid;
}
