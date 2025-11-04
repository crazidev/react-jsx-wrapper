// extension.ts - Enhanced Refactoring Provider with Framework Support
import * as vscode from "vscode";

type removalBehavior =
  | "remove-with-children"
  | "remove-without-children"
  | "both";

interface WrapperConfig {
  name: string;
  import?: {
    module: string;
    named?: boolean;
    default?: boolean;
  };
  attributes?: string;
  selfClosing?: boolean;
  removalBehavior?: removalBehavior;
}

export function activate(context: vscode.ExtensionContext) {
  const provider = new ConfigurableRefactoringProvider();

  const providerDisposable = vscode.languages.registerCodeActionsProvider(
    [
      { scheme: "file", language: "javascriptreact" },
      { scheme: "file", language: "typescriptreact" },
      { scheme: "file", language: "javascript" },
      { scheme: "file", language: "typescript" },
    ],
    provider,
    {
      providedCodeActionKinds: [vscode.CodeActionKind.RefactorRewrite],
    }
  );

  context.subscriptions.push(providerDisposable);
}

class ConfigurableRefactoringProvider implements vscode.CodeActionProvider {
  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] | undefined {
    const config = vscode.workspace.getConfiguration("jsxWrapper");
    const smartDetection = config.get<boolean>("smartDetection", true);
    const defaultRemovalBehavior = config.get<removalBehavior>(
      "defaultRemovalBehavior",
      "both"
    );

    let targetRange = range;

    // Smart detection: If cursor is in JSX element, expand to full element
    if (smartDetection && range.isEmpty) {
      const expandedRange = this.findJSXElementRange(document, range.start);
      if (expandedRange) {
        targetRange = expandedRange;
      } else {
        return undefined;
      }
    } else if (smartDetection && !range.isEmpty) {
      // If selection doesn't look complete, try to expand it
      const selectedText = document.getText(range);
      if (!this.isCompleteJSXElement(selectedText)) {
        const expandedRange = this.findJSXElementRange(document, range.start);
        if (expandedRange) {
          targetRange = expandedRange;
        }
      }
    } else if (range.isEmpty) {
      return undefined;
    }

    const selectedText = document.getText(targetRange);

    // Only show for JSX-like content
    const isJSXFile = ["javascriptreact", "typescriptreact"].includes(
      document.languageId
    );
    if (!isJSXFile && !this.looksLikeJSX(selectedText)) {
      return undefined;
    }

    const actions: vscode.CodeAction[] = [];

    // Get wrappers from configuration
    const wrappers = this.getWrappersFromConfig();

    // Add wrap actions
    actions.push(
      ...wrappers.map((wrapper) =>
        this.createWrapWithAction(document, targetRange, wrapper)
      )
    );

    // Add "Wrap with element..." action for custom element
    actions.push(this.createWrapWithCustomElementAction(document, targetRange));

    // Add unwrap actions if this is a JSX element with a tag
    const elementInfo = this.parseJSXElement(selectedText);
    if (elementInfo && elementInfo.tagName) {
      const removalBehavior = this.elementRemovalBehavior(
        elementInfo.tagName,
        wrappers,
        defaultRemovalBehavior
      );

      if (removalBehavior === "remove-with-children") {
        actions.push(this.createUnwrapAction(document, targetRange, true));
      } else if (removalBehavior === "remove-without-children") {
        actions.push(this.createUnwrapAction(document, targetRange, false));
      } else {
        // Show both options for text wrappers
        actions.push(this.createUnwrapAction(document, targetRange, false));
        actions.push(this.createUnwrapAction(document, targetRange, true));
      }
    }

    return actions;
  }

  private elementRemovalBehavior(
    tagName: string,
    wrappers: WrapperConfig[],
    defaultRemovalBehavior: removalBehavior
  ): removalBehavior {
    // Check custom wrappers first
    const wrapper = wrappers.find((w) => w.name === tagName);
    if (wrapper && wrapper.removalBehavior !== undefined) {
      return wrapper.removalBehavior;
    }

    // No default assumptions - let user configure
    return defaultRemovalBehavior;
  }

  private parseJSXElement(
    jsxString: string
  ): { tagName: string; hasChildren: boolean; isSelfClosing: boolean } | null {
    const trimmed = jsxString.trim();

    // Self-closing tag
    const selfClosingMatch = trimmed.match(/^<([a-zA-Z_$][\w.$]*)[^>]*\/>$/);
    if (selfClosingMatch) {
      return {
        tagName: selfClosingMatch[1],
        hasChildren: false,
        isSelfClosing: true,
      };
    }

    // Regular element
    const openTagMatch = trimmed.match(/^<([a-zA-Z_$][\w.$]*)/);
    if (!openTagMatch) {
      return null;
    }

    const tagName = openTagMatch[1];
    const closeTag = `</${tagName}>`;

    if (!trimmed.endsWith(closeTag)) {
      return null;
    }

    // Extract content between tags
    const openTagEnd = trimmed.indexOf(">") + 1;
    const closeTagStart = trimmed.lastIndexOf(closeTag);
    const content = trimmed.substring(openTagEnd, closeTagStart).trim();

    return {
      tagName,
      hasChildren: content.length > 0,
      isSelfClosing: false,
    };
  }

  private createUnwrapAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    removeChildren: boolean
  ): vscode.CodeAction {
    const title = removeChildren
      ? "Remove element with children"
      : "Remove element (keep children)";

    const action = new vscode.CodeAction(
      title,
      vscode.CodeActionKind.RefactorRewrite
    );

    const edit = new vscode.WorkspaceEdit();
    const selectedText = document.getText(range);
    const elementInfo = this.parseJSXElement(selectedText);

    if (!elementInfo) {
      return action;
    }

    if (removeChildren || elementInfo.isSelfClosing) {
      // Remove entire element
      edit.delete(document.uri, range);
    } else {
      // Extract and keep children - FIXED VERSION
      const trimmed = selectedText.trim();
      const openTagEnd = trimmed.indexOf(">") + 1;
      const closeTagStart = trimmed.lastIndexOf(`</${elementInfo.tagName}>`);
      let children = trimmed.substring(openTagEnd, closeTagStart);

      // Remove leading/trailing newlines and extra whitespace
      children = children.replace(/^\s*\n/, "").replace(/\n\s*$/, "");

      // Get the indentation of the original element
      const startLine = document.lineAt(range.start.line);
      const baseIndent = this.getIndentation(startLine.text);

      // Dedent children relative to their original position
      const childLines = children.split("\n");

      // Find the minimum indentation in children (excluding empty lines)
      let minIndent = Infinity;
      for (const line of childLines) {
        if (line.trim()) {
          const leadingSpaces = line.match(/^(\s*)/)?.[1].length || 0;
          minIndent = Math.min(minIndent, leadingSpaces);
        }
      }

      // Remove the minimum indentation and apply base indentation
      const reindented = childLines
        .map((line) => {
          if (!line.trim()) return "";
          const dedented = line.substring(
            minIndent === Infinity ? 0 : minIndent
          );
          return baseIndent + dedented;
        })
        .join("\n");

      edit.replace(document.uri, range, reindented);
    }

    // Add format command
    const config = vscode.workspace.getConfiguration("jsxWrapper");
    const formatAfterWrap = config.get<boolean>("formatAfterWrap", true);
    if (formatAfterWrap) {
      action.command = {
        title: "Format Document",
        command: "editor.action.formatDocument",
      };
    }

    action.edit = edit;
    return action;
  }

  private createWrapWithCustomElementAction(
    document: vscode.TextDocument,
    range: vscode.Range
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      "Wrap with element...",
      vscode.CodeActionKind.RefactorRewrite
    );

    const selectedText = document.getText(range);
    const startLine = document.lineAt(range.start.line);
    const indent = this.getIndentation(startLine.text);
    const childIndent = indent + this.getTabSize(document);

    // Calculate positions for snippets
    const lines = selectedText.split("\n");
    const reindented = lines
      .map((line, i) => {
        if (i === 0 && line.trim()) {
          return childIndent + line.trimStart();
        }
        return line ? childIndent + line.trimStart() : line;
      })
      .join("\n");

    // Create snippet with tab stops
    const snippet = `${indent}<\${1:element}>\n${reindented}\n${indent}</\${1:element}>`;

    action.edit = new vscode.WorkspaceEdit();
    action.edit.replace(document.uri, range, ""); // Placeholder

    // Use snippet instead of plain text
    action.command = {
      title: "Insert Snippet",
      command: "editor.action.insertSnippet",
      arguments: [
        {
          snippet: snippet,
          range: range,
        },
      ],
    };

    return action;
  }

  private findJSXElementRange(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Range | null {
    const text = document.getText();
    const offset = document.offsetAt(position);

    // Find opening tag start
    let openStart = offset;
    while (openStart > 0 && text[openStart] !== "<") {
      openStart--;
    }

    if (text[openStart] !== "<") {
      return null;
    }

    // Check if we're in a valid JSX element name or opening tag
    const afterOpen = text.substring(openStart, offset);
    if (!afterOpen.match(/^<[a-zA-Z_$][\w.$]*/)) {
      return null;
    }

    // Find the matching closing tag
    const tagNameMatch = text
      .substring(openStart)
      .match(/^<([a-zA-Z_$][\w.$]*)/);
    if (!tagNameMatch) {
      return null;
    }

    const tagName = tagNameMatch[1];

    // Handle self-closing tags
    const selfClosingMatch = text.substring(openStart).match(/^<[^>]+\/>/);
    if (selfClosingMatch) {
      const end = openStart + selfClosingMatch[0].length;
      return new vscode.Range(
        document.positionAt(openStart),
        document.positionAt(end)
      );
    }

    // Find closing tag for regular elements
    const closeTag = `</${tagName}>`;
    let depth = 1;
    let searchPos = openStart + tagNameMatch[0].length;

    // Skip to end of opening tag
    while (searchPos < text.length && text[searchPos] !== ">") {
      searchPos++;
    }
    searchPos++; // Move past '>'

    while (searchPos < text.length && depth > 0) {
      // Look for opening or closing tags
      const nextOpen = text.indexOf(`<${tagName}`, searchPos);
      const nextClose = text.indexOf(closeTag, searchPos);

      if (nextClose === -1) {
        return null; // No closing tag found
      }

      if (nextOpen !== -1 && nextOpen < nextClose) {
        // Check if it's actually an opening tag (not part of another tag name)
        const charAfter = text[nextOpen + tagName.length + 1];
        if (
          charAfter === " " ||
          charAfter === ">" ||
          charAfter === "\n" ||
          charAfter === "\r"
        ) {
          depth++;
        }
        searchPos = nextOpen + tagName.length + 1;
      } else {
        // Found closing tag
        depth--;
        if (depth === 0) {
          const end = nextClose + closeTag.length;
          return new vscode.Range(
            document.positionAt(openStart),
            document.positionAt(end)
          );
        }
        searchPos = nextClose + closeTag.length;
      }
    }

    return null;
  }

  private isCompleteJSXElement(text: string): boolean {
    const trimmed = text.trim();

    // Check if it's a self-closing tag
    if (trimmed.match(/^<[^>]+\/>$/)) {
      return true;
    }

    // Check if it has matching opening and closing tags
    const openMatch = trimmed.match(/^<([a-zA-Z_$][\w.$]*)/);
    if (!openMatch) {
      return false;
    }

    const tagName = openMatch[1];
    const closeTag = `</${tagName}>`;

    return trimmed.endsWith(closeTag);
  }

  private getWrappersFromConfig(): WrapperConfig[] {
    const config = vscode.workspace.getConfiguration("jsxWrapper");
    const customWrappers = config.get<WrapperConfig[]>("wrappers", []);

    // If user has custom wrappers, use only those
    if (customWrappers.length > 0) {
      return customWrappers;
    }

    // Otherwise, use framework-based defaults
    const framework = config.get<string>("framework", "react");
    return this.getFrameworkDefaults(framework);
  }

  private getFrameworkDefaults(framework: string): WrapperConfig[] {
    switch (framework) {
      case "react-native":
        return [
          {
            name: "View",
            import: { module: "react-native", named: true },
          },
          {
            name: "Text",
            import: { module: "react-native", named: true },
            removalBehavior: "remove-with-children",
          },
          {
            name: "Pressable",
            import: { module: "react-native", named: true },
            attributes: "onPress={() => {}}",
          },
          {
            name: "TouchableOpacity",
            import: { module: "react-native", named: true },
            attributes: "onPress={() => {}}",
          },
          {
            name: "ScrollView",
            import: { module: "react-native", named: true },
          },
        ];

      case "html":
        return [
          { name: "div", attributes: 'className=""' },
          { name: "span", attributes: 'className=""' },
          { name: "button", attributes: 'onclick=""' },
          { name: "center" },
          { name: "b" },
          { name: "hr" },
          { name: "br" },
        ];

      case "react":
      default:
        return [
          { name: "div", attributes: 'className=""' },
          { name: "span", attributes: 'className=""' },
          { name: "button", attributes: "onClick={() => {}}" },
        ];
    }
  }

  private looksLikeJSX(text: string): boolean {
    const trimmed = text.trim();
    return (
      trimmed.startsWith("<") ||
      trimmed.startsWith("{") ||
      /[a-zA-Z_$][a-zA-Z0-9_$]*/.test(trimmed)
    );
  }

  private createWrapWithAction(
    document: vscode.TextDocument,
    range: vscode.Range,
    wrapper: WrapperConfig
  ): vscode.CodeAction {
    const action = new vscode.CodeAction(
      `Wrap with ${wrapper.name}`,
      vscode.CodeActionKind.RefactorRewrite
    );

    // Set preferred if configured
    const config = vscode.workspace.getConfiguration("jsxWrapper");
    const preferred = config.get<string>("preferredWrapper", "View");
    action.isPreferred = wrapper.name === preferred;

    const edit = new vscode.WorkspaceEdit();
    const selectedText = document.getText(range);

    // Calculate indentation
    const startLine = document.lineAt(range.start.line);
    const indent = this.getIndentation(startLine.text);
    const childIndent = indent + this.getTabSize(document);

    // Wrap the content
    const wrapped = this.wrapContent(
      selectedText,
      wrapper.name,
      indent,
      childIndent,
      wrapper.attributes,
      wrapper.selfClosing
    );
    edit.replace(document.uri, range, wrapped);

    // Add import if configured
    if (wrapper.import) {
      this.addImport(edit, document, wrapper.name, wrapper.import);
    }

    action.edit = edit;

    // Add post-edit command to format
    const formatAfterWrap = config.get<boolean>("formatAfterWrap", true);
    if (formatAfterWrap) {
      action.command = {
        title: "Format Document",
        command: "editor.action.formatDocument",
      };
    }

    return action;
  }

  private wrapContent(
    content: string,
    componentName: string,
    indent: string,
    childIndent: string,
    attributes?: string,
    selfClosing?: boolean
  ): string {
    const lines = content.split("\n");
    const reindented = lines
      .map((line, i) => {
        if (i === 0 && line.trim()) {
          return childIndent + line.trimStart();
        }
        return line ? childIndent + line.trimStart() : line;
      })
      .join("\n");

    const attrs = attributes ? ` ${attributes}` : "";

    if (selfClosing) {
      return `${indent}<${componentName}${attrs}>\n${reindented}\n${indent}</${componentName}>`;
    }

    return `${indent}<${componentName}${attrs}>\n${reindented}\n${indent}</${componentName}>`;
  }

  private getIndentation(lineText: string): string {
    const match = lineText.match(/^(\s*)/);
    return match ? match[1] : "";
  }

  private getTabSize(document: vscode.TextDocument): string {
    const editorConfig = vscode.workspace.getConfiguration(
      "editor",
      document.uri
    );
    const insertSpaces = editorConfig.get<boolean>("insertSpaces", true);
    const tabSize = editorConfig.get<number>("tabSize", 2);
    return insertSpaces ? " ".repeat(tabSize) : "\t";
  }

  private addImport(
    edit: vscode.WorkspaceEdit,
    document: vscode.TextDocument,
    componentName: string,
    importConfig: { module: string; named?: boolean; default?: boolean }
  ): void {
    const text = document.getText();
    const { module, named, default: isDefault } = importConfig;

    // Check what type of import to add
    if (named) {
      this.addNamedImport(edit, document, text, componentName, module);
    } else if (isDefault) {
      this.addDefaultImport(edit, document, text, componentName, module);
    }
  }

  private addNamedImport(
    edit: vscode.WorkspaceEdit,
    document: vscode.TextDocument,
    text: string,
    componentName: string,
    moduleName: string
  ): void {
    // Escape special regex characters in module name
    const escapedModule = moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Check if already imported
    const alreadyImported = new RegExp(
      `import\\s*{[^}]*\\b${componentName}\\b[^}]*}\\s*from\\s+['"]${escapedModule}['"]`
    ).test(text);

    if (alreadyImported) {
      return;
    }

    // Find existing import from same module
    const importRegex = new RegExp(
      `import\\s*{([^}]*?)}\\s*from\\s+['"]${escapedModule}['"]`
    );
    const importMatch = text.match(importRegex);

    if (importMatch) {
      // Add to existing import
      const [fullMatch, imports] = importMatch;
      const importsList = imports
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      if (!importsList.includes(componentName)) {
        importsList.push(componentName);
        importsList.sort();
        const newImport = `import { ${importsList.join(
          ", "
        )} } from '${moduleName}'`;

        const startPos = document.positionAt(text.indexOf(fullMatch));
        const endPos = document.positionAt(
          text.indexOf(fullMatch) + fullMatch.length
        );
        edit.replace(
          document.uri,
          new vscode.Range(startPos, endPos),
          newImport
        );
      }
    } else {
      // Add new import
      const insertPos = this.findImportInsertPosition(
        document,
        text,
        moduleName
      );
      edit.insert(
        document.uri,
        insertPos,
        `import { ${componentName} } from '${moduleName}';\n`
      );
    }
  }

  private addDefaultImport(
    edit: vscode.WorkspaceEdit,
    document: vscode.TextDocument,
    text: string,
    componentName: string,
    moduleName: string
  ): void {
    // Escape special regex characters
    const escapedModule = moduleName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    // Check if already imported
    const alreadyImported = new RegExp(
      `import\\s+${componentName}\\s+from\\s+['"]${escapedModule}['"]`
    ).test(text);

    if (alreadyImported) {
      return;
    }

    // Add new default import
    const insertPos = this.findImportInsertPosition(document, text, moduleName);
    edit.insert(
      document.uri,
      insertPos,
      `import ${componentName} from '${moduleName}';\n`
    );
  }

  private findImportInsertPosition(
    document: vscode.TextDocument,
    text: string,
    moduleName: string
  ): vscode.Position {
    // Try to insert after last import statement
    const importLines: number[] = [];
    const lines = text.split("\n");

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith("import ")) {
        importLines.push(i);
      }
    }

    if (importLines.length > 0) {
      const lastImportLine = importLines[importLines.length - 1];
      return new vscode.Position(lastImportLine + 1, 0);
    }

    // No imports found, insert at top
    return new vscode.Position(0, 0);
  }
}

export function deactivate() {}
