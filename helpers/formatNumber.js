export default function formatNumber(number) { 
    if(typeof number !== 'string') {
        throw new TypeError('Expected a string')
    }
    if(!number.startsWith('521') || number.length !== 13 ) {
        throw new Error("Wrong format")
    } 

    return number.replace(/^52(1)/, '52')
}