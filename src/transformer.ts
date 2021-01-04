#!/usr/bin/env node
import ts from "typescript";
import {
  createArrowFunction,
  createFunction,
  createMethodProperty,
  createUseStateStatement,
  createVariableStatement,
  wrapInMemo,
  createUseEffect,
  capitalize,
} from "./builders";
import {
  doesNameMatchWith,
  getSuperClass,
  hasDefaultExport,
  isInitialPropsFunction,
  isMethodBindingStatement,
  isRenderMethod,
  isSuperCtorCall,
} from "./checkers";
import { cloneNode } from "@wessberg/ts-clone-node";

function printJson(params: any) {
  console.log(JSON.stringify(params, null, 2));
}

const printer = ts.createPrinter();

const tFactory: ts.TransformerFactory<ts.Node> = (context: ts.TransformationContext) => {
  const compilerOptions = context.getCompilerOptions();
  return (rootNode) => {
    let ctx = {
      componentName: "",
      functionProperties: [] as ts.Node[],
      componentDidMount: undefined as ts.Statement[] | undefined,
      componentWillUnmount: undefined as ts.Statement[] | undefined,
      componentDidUpdate: undefined as ts.Statement[] | undefined,
    };

    function visitCtorStatement(statement: ts.Statement): ts.Statement | ts.Statement[] {
      if (
        ts.isExpressionStatement(statement) &&
        ts.isBinaryExpression(statement.expression) &&
        ts.isPropertyAccessExpression(statement.expression.left) &&
        statement.expression.left.expression.kind === ts.SyntaxKind.ThisKeyword &&
        statement.expression.left.name.escapedText === "state"
      ) {
        if (compilerOptions.spreadState && ts.isObjectLiteralExpression(statement.expression.right)) {
          return statement.expression.right.properties.reduce((res, prop) => {
            if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
              res.push(createUseStateStatement(prop.initializer, prop.name.escapedText as string));
            }
            return res;
          }, [] as ts.Statement[]);
        } else {
          return createUseStateStatement(statement.expression.right);
        }
      }
      return statement;
    }

    /**
     * Remove statements like this.handleClick = this.handleClick.bind(this)
     * Extract state initialization.
     * Remove super ctor call.
     */
    function visitConstructor(ctor: ts.ConstructorDeclaration): ts.Statement[] {
      if (!ctor.body) return [];

      return ctor.body.statements
        .filter((st) => !(isSuperCtorCall(st) || isMethodBindingStatement(st)))
        .reduce((res, oldStatement) => {
          const newStatement = visitCtorStatement(oldStatement);
          if (Array.isArray(newStatement)) {
            res.push(...newStatement);
          } else {
            res.push(newStatement);
          }
          return res;
        }, [] as ts.Statement[]);
    }

    function visitNode(node: ts.Node): ts.Node | ts.Node[] {
      // this.setState({ example: "Hello world"})
      if (
        compilerOptions.spreadState &&
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        ts.isIdentifier(node.expression.name) &&
        node.expression.name.escapedText === "setState" &&
        node.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
        ts.isObjectLiteralExpression(node.arguments[0])
      ) {
        const object = node.arguments[0] as ts.ObjectLiteralExpression;
        // TODO: we should check if setXYZ exists
        return object.properties.reduce((res, prop) => {
          if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name)) {
            res.push(
              ts.factory.createCallExpression(
                ts.factory.createIdentifier(`set${capitalize(prop.name.escapedText)}`),
                undefined,
                [ts.visitEachChild(prop.initializer, visitNode, context)]
              )
            );
          }
          return res;
        }, [] as ts.Node[]);
      }
      // this.state.hello => hello
      if (
        compilerOptions.spreadState &&
        ts.isPropertyAccessExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        node.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
        ts.isIdentifier(node.expression.name) &&
        node.expression.name.escapedText === "state"
      ) {
        return node.name;
      }

      if (ts.isPropertyAccessExpression(node) && node.expression.kind === ts.SyntaxKind.ThisKeyword) {
        return node.name;
      }
      return ts.visitEachChild(node, visitNode, context);
    }

    // Removes this.XYZ property accessors
    function visitStatements(statements: ts.NodeArray<ts.Statement>): ts.Statement[] {
      return statements.map((st) => visitNode(st)) as ts.Statement[];
    }

    function visitRenderMethod(rdrMethod: ts.MethodDeclaration) {
      if (!rdrMethod.body) return [];
      return visitStatements(rdrMethod.body.statements);
    }

    function visitMemberMethod(method: ts.MethodDeclaration): ts.Statement[] {
      if (!method.body) return [];

      /**
       * static getInitialProps(ctx) {
       * ....
       * }
       */
      if (isInitialPropsFunction(method)) {
        ctx.functionProperties.push(
          createMethodProperty(
            ctx.componentName,
            "getInitialProps",
            createArrowFunction([...method.parameters], method.body, [
              ...(method.modifiers ? method.modifiers.filter((m) => m.kind !== ts.SyntaxKind.StaticKeyword) : []),
            ])
          )
        );
        return [];
      }

      if (doesNameMatchWith("componentDidMount", method)) {
        ctx.componentDidMount = visitStatements(method.body!.statements);
        return [];
      }

      if (doesNameMatchWith("componentWillUnmount", method)) {
        ctx.componentWillUnmount = visitStatements(method.body!.statements);
        return [];
      }

      if (doesNameMatchWith("componentDidUpdate", method)) {
        ctx.componentDidUpdate = visitStatements(method.body!.statements);
        return [];
      }

      /**
       * foo(param) {
       *  ...
       * }
       */
      if (ts.isIdentifier(method.name)) {
        const statements = visitStatements(method.body.statements);
        return [
          createVariableStatement(
            method.name.escapedText as string,
            createArrowFunction([...method.parameters], ts.factory.createBlock(statements, true))
          ),
        ];
      }
      return [];
    }

    // Class property declarations
    function visitPropertyDeclaration(decl: ts.PropertyDeclaration): ts.Statement[] {
      // console.log("prop dec");
      /**
       * state = {
       *  key: 'value'
       * }
       */
      if (ts.isIdentifier(decl.name) && decl.name.escapedText === "state" && decl.initializer) {
        console.log("useState");
        return [createUseStateStatement(cloneNode(decl.initializer))];
      }
      /**
       * static propTypes = {
       * }
       */
      if (ts.isIdentifier(decl.name) && decl.name.escapedText === "propTypes" && decl.initializer) {
        ctx.functionProperties.push(createMethodProperty(ctx.componentName, "propTypes", decl.initializer));
        return [];
      }
      /**
       * static defaultProps = {
       * }
       */
      if (ts.isIdentifier(decl.name) && decl.name.escapedText === "defaultProps" && decl.initializer) {
        ctx.functionProperties.push(createMethodProperty(ctx.componentName, "defaultProps", decl.initializer));
        return [];
      }
      /**
       * handleClick = () => this.setState(true)
       * handleClick = () => { this.setState(true) }
       */
      if (ts.isIdentifier(decl.name) && decl.initializer && ts.isArrowFunction(decl.initializer)) {
        return [
          createVariableStatement(
            decl.name.escapedText as string,
            createArrowFunction(
              [...decl.initializer.parameters],
              ts.isBlock(decl.initializer.body)
                ? ts.factory.createBlock(visitStatements(decl.initializer.body.statements), true)
                : (visitNode(decl.initializer.body) as ts.Expression)
            )
          ),
        ];
      }
      /**
       *
       */
      if (ts.isIdentifier(decl.name)) {
        return [
          createVariableStatement(
            decl.name.escapedText as string,
            ts.factory.createCallExpression(
              ts.factory.createIdentifier("useRef"),
              undefined,
              decl.initializer ? [decl.initializer] : []
            )
          ),
        ];
      }
      return [];
    }

    function visitClassElement(element: ts.ClassElement) {
      if (ts.isConstructorDeclaration(element)) {
        return visitConstructor(element);
      } else if (isRenderMethod(element)) {
        return visitRenderMethod(element);
      } else if (ts.isMethodDeclaration(element)) {
        return visitMemberMethod(element);
      } else if (ts.isPropertyDeclaration(element)) {
        return visitPropertyDeclaration(element);
      }
      return [];
    }

    function visitClass(classDeclaration: ts.ClassDeclaration) {
      const superClass = getSuperClass(classDeclaration);
      const isReactComponent = superClass === "Component" || superClass === "PureComponent";
      if (!isReactComponent) return classDeclaration;

      ctx.componentName = classDeclaration.name?.escapedText as string;

      // TODO: REFACTOR
      const statements = classDeclaration.members
        .map((el) => visitClassElement(el))
        .flat(3)
        .filter((item) => !!item) as ts.Statement[];

      if (ctx.componentDidMount || ctx.componentWillUnmount) {
        statements.push(createUseEffect(ctx.componentDidMount, ctx.componentWillUnmount, true));
      }

      if (ctx.componentDidUpdate) {
        statements.push(createUseEffect(ctx.componentDidUpdate));
      }

      return [
        superClass === "Component"
          ? createFunction(
              classDeclaration.name && ts.isIdentifier(classDeclaration.name)
                ? (classDeclaration.name.escapedText as string)
                : undefined,
              [...statements]
            )
          : createVariableStatement(
              classDeclaration.name?.escapedText! as string,
              wrapInMemo([
                createArrowFunction(
                  [ts.factory.createParameterDeclaration(undefined, undefined, undefined, "props")],
                  ts.factory.createBlock(statements, true)
                ),
              ])
            ),
        ...ctx.functionProperties,
        ...(hasDefaultExport(classDeclaration)
          ? [
              ts.factory.createExportAssignment(
                undefined,
                undefined,
                undefined,
                ts.factory.createIdentifier(ctx.componentName)
              ),
            ]
          : []),
      ];
    }

    function startVisit(node: ts.Node): ReturnType<ts.Visitor> {
      if (ts.isClassDeclaration(node)) {
        return visitClass(node);
      } else {
        return ts.visitEachChild(node, startVisit, context);
      }
    }
    return ts.visitNode(rootNode, startVisit);
  };
};

export function transform(
  fileName: string,
  text: string,
  options: {
    spreadState?: boolean;
  }
) {
  const tsSourceFile = ts.createSourceFile(fileName, text, ts.ScriptTarget.Latest);
  const transResult = ts.transform(tsSourceFile, [tFactory], options);
  //@ts-ignore
  const result = printer.printNode(ts.EmitHint.Unspecified, transResult.transformed[0], tsSourceFile);
  return result;
}
