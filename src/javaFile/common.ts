import { TokenizedLine } from "../Parse/tokenizedLine";
import { genericAnnotation } from "../Parse/tokens";
import { index } from "../utils";

export const findAnnotations = (
  tokens: string[]
): { annotations: string[]; annotationEnd: number } => {
  const annotationEnd = tokens.findIndex(
    (token) => !genericAnnotation.some((annotation) => annotation.test(token))
  );

  const annotations = tokens.slice(0, annotationEnd);

  return {
    annotations: annotations,
    annotationEnd: annotationEnd,
  };
};

export const separateMethodFromParameter = (
  line: TokenizedLine
): TokenizedLine => {
  const methodNameLocation = line.tokens.findIndex((token) => /\(/.test(token));

  if (methodNameLocation === -1) {
    return line;
  }

  const targetToken = index(line.tokens, methodNameLocation);
  const separateLocation = targetToken.indexOf("(");
  const separatedTokens = [
    targetToken.slice(0, separateLocation),
    targetToken.slice(separateLocation),
  ];

  return {
    tokens: line.tokens.toSpliced(methodNameLocation, 1, ...separatedTokens),
    index: line.index,
  };
};

export const determineParameters = (parameters: string): string[] => {
  const removedParenthesis = parameters.slice(1, -1);

  if (removedParenthesis === "") {
    return [];
  }

  const splitParameters = removedParenthesis.split(/, | /);
  const reconnectedTypes = reconnectTypes(splitParameters);

  type reconnector = {
    parameters: string[];
    hasType: boolean;
  };

  const reconnectedParameters = reconnectedTypes.reduce(
    (reconnectedParameters: reconnector, token: string): reconnector => {
      const parameters = reconnectedParameters.parameters;

      if (reconnectedParameters.hasType) {
        return {
          parameters: parameters.with(-1, index(parameters, -1) + " " + token),
          hasType: false,
        };
      }

      return {
        parameters: parameters.concat([token]),
        hasType: true,
      };
    },
    { parameters: [], hasType: false }
  ).parameters;

  return reconnectedParameters;
};

const reconnectTypes = (parameters: string[]): string[] => {
  type reconnector = {
    reconnectedParameters: string[];
    inTypeDeclaration: boolean;
  };

  return parameters.reduce(
    (connector: reconnector, token): reconnector => {
      const reconnectedParameters = connector.reconnectedParameters;

      if (connector.inTypeDeclaration) {
        return {
          reconnectedParameters: reconnectedParameters.with(
            -1,
            index(reconnectedParameters, -1) + ", " + token
          ),
          inTypeDeclaration: !/>/.test(token),
        };
      }

      return {
        reconnectedParameters: reconnectedParameters.concat([token]),
        inTypeDeclaration: /</.test(token),
      };
    },
    { reconnectedParameters: [], inTypeDeclaration: false }
  ).reconnectedParameters;
};
