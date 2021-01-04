import ts from "typescript";

export function isClassExtendsReactComponent(
  node: ts.ClassDeclaration,
  reactComponentToExtend: string[] = ["Component", "PureComponent"]
) {
  if (!node.heritageClauses) return false;
  for (const clause of node.heritageClauses) {
    for (const type of clause.types) {
      if (
        ts.isExpressionWithTypeArguments(type) &&
        ts.isPropertyAccessExpression(type.expression) &&
        ts.isIdentifier(type.expression.expression) &&
        type.expression.expression.escapedText === "React" &&
        reactComponentToExtend.includes(type.expression.name.escapedText as string)
      ) {
        return true;
      }
    }
  }
  return false;
}

export function getSuperClass(node: ts.ClassDeclaration) {
  if (!node.heritageClauses) return false;
  for (const clause of node.heritageClauses) {
    for (const type of clause.types) {
      if (
        ts.isExpressionWithTypeArguments(type) &&
        ts.isPropertyAccessExpression(type.expression) &&
        ts.isIdentifier(type.expression.expression) &&
        type.expression.expression.escapedText === "React"
      ) {
        return type.expression.name.escapedText as string;
      }
    }
  }
  return false;
}

export function hasDefaultExport(node: ts.ClassDeclaration) {
  return (
    node.modifiers?.[0].kind === ts.SyntaxKind.ExportKeyword &&
    node.modifiers?.[1].kind === ts.SyntaxKind.DefaultKeyword
  );
}

export function isSuperCtorCall(statement: ts.Statement) {
  return (
    ts.isExpressionStatement(statement) &&
    ts.isCallExpression(statement.expression) &&
    statement.expression.expression.kind === ts.SyntaxKind.SuperKeyword
  );
}

export function isRenderMethod(node: ts.ClassElement): node is ts.MethodDeclaration {
  return ts.isMethodDeclaration(node) && ts.isIdentifier(node.name) && node.name.escapedText === "render";
}

export function isMethodBindingStatement(statement: ts.Statement) {
  return (
    ts.isExpressionStatement(statement) &&
    ts.isBinaryExpression(statement.expression) &&
    ts.isPropertyAccessExpression(statement.expression.left) &&
    statement.expression.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
    statement.expression.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    ts.isCallExpression(statement.expression.right) &&
    ts.isPropertyAccessExpression(statement.expression.right.expression) &&
    ts.isIdentifier(statement.expression.right.expression.name) &&
    statement.expression.right.expression.name.escapedText === "bind" &&
    statement.expression.right.arguments.length === 1 &&
    statement.expression.right.arguments[0].kind === ts.SyntaxKind.ThisKeyword
  );
}

export function isInitialPropsFunction(method: ts.MethodDeclaration) {
  return ts.isIdentifier(method.name) && method.name.escapedText === "getInitialProps";
}

export function isComponentDidMount(method: ts.MethodDeclaration) {
  return ts.isIdentifier(method.name) && method.name.escapedText === "componentDidMount";
}

export function isComponentWillUnmount(method: ts.MethodDeclaration) {
  return ts.isIdentifier(method.name) && method.name.escapedText === "componentWillUnmount";
}

export function doesNameMatchWith(name: string, method: ts.MethodDeclaration) {
  return ts.isIdentifier(method.name) && method.name.escapedText === name;
}
