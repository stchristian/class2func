import ts, { factory, ParameterDeclaration } from "typescript";

export const capitalize = (s: any) => {
  if (typeof s !== "string") return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
};

export function createFunction(name?: string, statements: ts.Statement[] = [], modifiers: ts.Modifier[] = []) {
  return factory.createFunctionDeclaration(
    undefined,
    modifiers,
    undefined,
    name ? factory.createIdentifier(name) : undefined,
    undefined,
    [factory.createParameterDeclaration(undefined, undefined, undefined, factory.createIdentifier("props"))],
    undefined,
    factory.createBlock(statements, true)
  );
}

export function createUseEffect(statements: ts.Statement[] = [], unmount: ts.Statement[] = [], didMount = false) {
  const otherArgs = didMount ? [factory.createArrayLiteralExpression([], false)] : [];
  return factory.createExpressionStatement(
    factory.createCallExpression(factory.createIdentifier("useEffect"), undefined, [
      createArrowFunction(
        undefined,
        ts.factory.createBlock(
          [
            ...statements,
            factory.createReturnStatement(
              factory.createArrowFunction(
                undefined,
                undefined,
                [],
                undefined,
                factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
                factory.createBlock(unmount, true)
              )
            ),
          ],
          true
        )
      ),
      ...otherArgs,
    ])
  );
}

export function createUseStateStatement(initialState: ts.Expression, stateName: string = "state") {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [
        factory.createVariableDeclaration(
          factory.createArrayBindingPattern([
            factory.createBindingElement(undefined, undefined, factory.createIdentifier(stateName), undefined),
            factory.createBindingElement(
              undefined,
              undefined,
              factory.createIdentifier(`set${capitalize(stateName)}`),
              undefined
            ),
          ]),
          undefined,
          undefined,
          factory.createCallExpression(factory.createIdentifier("useState"), undefined, [initialState])
        ),
      ],
      ts.NodeFlags.Const
    )
  );
}

export function createVariableStatement(variableName: string, initializer: ts.Expression) {
  return factory.createVariableStatement(
    undefined,
    factory.createVariableDeclarationList(
      [factory.createVariableDeclaration(factory.createIdentifier(variableName), undefined, undefined, initializer)],
      ts.NodeFlags.Const
    )
  );
}

export function createArrowFunction(
  params: ts.ParameterDeclaration[] = [],
  body: ts.ConciseBody,
  modifiers: ts.Modifier[] = []
) {
  return factory.createArrowFunction(
    modifiers,
    undefined,
    params,
    undefined,
    factory.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
    body
  );
}

export function wrapInMemo(args: ts.Expression[]) {
  return factory.createCallExpression(
    factory.createPropertyAccessExpression(factory.createIdentifier("React"), factory.createIdentifier("memo")),
    undefined,
    args
  );
}

export function createMethodProperty(componentName: string, propertyName: string, right: ts.Expression) {
  return factory.createExpressionStatement(
    factory.createBinaryExpression(
      factory.createPropertyAccessExpression(
        factory.createIdentifier(componentName),
        factory.createIdentifier(propertyName)
      ),
      factory.createToken(ts.SyntaxKind.EqualsToken),
      right
    )
  );
}
