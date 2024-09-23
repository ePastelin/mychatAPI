export default function replaceVariables(text, exampleArray) {
    let result = text;
    exampleArray.forEach((value, index) => {
        const placeholder = `{{${index + 1}}}`; // {{1}}, {{2}}, etc.
        result = result.replace(placeholder, value);
    });
    return result;
}