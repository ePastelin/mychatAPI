export default function formatNumber(number) {
    if(number.startstWith('521')){
        return number.replace(/^52(1)/, '52')
    }

    return number
}