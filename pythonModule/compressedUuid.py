import re

BASE64_VALUES = [64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 64, 62, 64, 64, 64, 63, 52, 53, 54, 55, 56, 57, 58, 59, 60, 61,
                 64, 64, 64, 64, 64, 64, 64, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 64, 64, 64, 64, 64, 64, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51]
shotArr = list(set(BASE64_VALUES))
separator = '@'
HexChars = list('0123456789abcdef')

Indices = [0, 1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12, 14, 15, 16, 17,
           19, 20, 21, 22, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35]
compressedUuidTemplate = []



def compresse(base64):
    if len(base64.split(separator)[0]) != 36:
        return base64

    # "8c5b9bb2-a1c9-421f-a1b2-770e30b889f6@xxxxx" 这种格式一般是   纹理集@子图
    base64 = re.sub("-", "", base64)  # 把所有"-"都去掉
    strs = base64.split(separator)
    base64 = list(strs[0])  # 截取"@"字符的前段
    compressedUuidTemplate = []
    compressedUuidTemplate.append(base64[0])
    compressedUuidTemplate.append(base64[1])
    for i in range(2, len(base64), 3):
        a = HexChars.index(base64[i])
        recycling = False
        for x in range(a << 2, (a << 2) + 4, 1):
            if BASE64_VALUES.index(x) == 0:
                continue
            for y in range(len(shotArr)):
                if BASE64_VALUES.index(shotArr[y]) == 0:
                    continue
                if HexChars[x >> 2] == base64[i] and HexChars[((x & 3) << 2) | shotArr[y] >> 4] == base64[i + 1] and HexChars[shotArr[y] & 0xF] == base64[i + 2]:
                    compressedUuidTemplate.append(chr(BASE64_VALUES.index(x)))
                    compressedUuidTemplate.append(chr(BASE64_VALUES.index(shotArr[y])))
                    recycling = True
                    break
            if recycling == True:
                break

    if len(strs) > 1:
        return ''.join(compressedUuidTemplate) + separator + strs[1]
    else:
        return ''.join(compressedUuidTemplate)

