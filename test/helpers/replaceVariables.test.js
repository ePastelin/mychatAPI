import replaceVariables from "../../helpers/replaceVariables";
import { describe, test, expect } from "@jest/globals";

const text =
  "Hola, {{1}}. Este mensaje es para hacerte saber que te ganaste un premio para irte a {{2}}";
const textChanged =
  "Hola, Gustavo. Este mensaje es para hacerte saber que te ganaste un premio para irte a Las Quintas";
const variables = ["Gustavo", "Las Quintas", "100"];
const text2 =
  "El día de hoy {{1}}, estás invitado a la gran inaguración de nuestro local ubicado en {{2}} los {{3}} primeros en llegar de ganarán un gran premio";
const text2Changed =
  "El día de hoy 24 de julio, estás invitado a la gran inaguración de nuestro local ubicado en avenida Santa Catarina los 100 primeros en llegar de ganarán un gran premio";
const variables2 = ["24 de julio", "avenida Santa Catarina", "100"];

describe("Replace variables for template text", () => {
  test("Should just accept string for text and array for variables", () => {
    expect(() => replaceVariables(3240, "Hola")).toThrow(TypeError);
    expect(() => replaceVariables(text, 23452).toThrow(TypeError));
  });
  test("Should change the variables in correct order", () => {
    expect(replaceVariables(text, variables)).toBe(textChanged);
    expect(replaceVariables(text2, variables2)).toBe(text2Changed);
  });
});
