/*

Node.js String#split fix by Qumolama
Published at https://t.me/lamaradio/113
Opensource under Anti-996
Copyright 2022-Present Qumolama

*/
String.prototype._split = String.prototype.split
String.prototype.split = function(separator, limit) {
    if (separator === undefined && limit === 0) return []

    if(limit === undefined) {
        return String.prototype._split.call(this, separator, limit)
    }

    const arr = []
    let lastBegin = -1
    for(let i = 0; i < limit - 1; i++) {
        const end = String.prototype.indexOf.call(this, separator, ++lastBegin)
        if(end == -1) {
            arr.push(undefined)
            continue
        }
        arr.push(String.prototype.substring.call(this, lastBegin, end))
        lastBegin = end
    }
    arr.push(String.prototype.substring.call(this, ++lastBegin))

    return arr
}


function regexStartsWith(str, regex) {
    return str.indexOf(str.match(regex)) === 0
}

module.exports = { regexStartsWith }