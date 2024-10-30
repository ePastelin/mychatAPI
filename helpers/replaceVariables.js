export default function replaceVariables(text, exampleArray) {
    exampleArray.forEach((value, index) => {
        const placeholder = `{{${index + 1}}}`;
        text = text.replace(placeholder, value);
    });
    
    return text;
}