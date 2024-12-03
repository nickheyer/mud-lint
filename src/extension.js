const vscode = require('vscode');
const mud = require('./mud');
const completionsData = require('./stdlib.json');

function activate(context) {
  const tokenTypes = [
    'atom',
    'keyword',
    'builtin',
    'operator',
    'number',
    'string',
    'comment',
    'meta',
    'def',
    'string.special'
  ];
  const tokenModifiers = ['declaration', 'definition', 'readonly', 'static'];
  const legend = new vscode.SemanticTokensLegend(tokenTypes, tokenModifiers);
  const completionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'mud' },
    {
      provideCompletionItems(document, position) {
        return completionsData.completions.map(item => {
          const completionItem = new vscode.CompletionItem(
            item.label,
            vscode.CompletionItemKind.Function
          );
          completionItem.detail = item.info;
          completionItem.documentation = `Section: ${item.section}`;
          return completionItem;
        });
      }
    },
    '.' // TRIGGER AC AFTER TYPING "."
  );

  // BOOTSTRAP WITH CODE MIRROR LOGIC RE-USED
  const semanticTokensProvider = vscode.languages.registerDocumentSemanticTokensProvider(
    { language: 'mud' },
    {
      provideDocumentSemanticTokens(document) {
        const tokensBuilder = new vscode.SemanticTokensBuilder(legend);
        const lines = document.getText().split('\n');

        for (let lineNumber = 0; lineNumber < lines.length; lineNumber++) {
          const line = lines[lineNumber];
          const stream = createStream(line);
          const state = mud.startState();

          while (!stream.eol()) {
            const tokenType = mud.token(stream, state);

            // DEBUG DUMB VSCODE
            console.log(`Token Type: ${tokenType}`);

            if (tokenType && tokenTypes.includes(tokenType)) {
              const start = stream.startPos;
              const end = stream.pos;
              tokensBuilder.push(
                new vscode.Range(
                  new vscode.Position(lineNumber, start),
                  new vscode.Position(lineNumber, end)
                ),
                tokenType
              );
            } else if (tokenType) {
              console.warn(`Unknown token type: ${tokenType}`);
            }
          }
        }
        return tokensBuilder.build();
      }
    },
    legend
  );

  context.subscriptions.push(completionProvider, semanticTokensProvider);
}

function deactivate() {}

module.exports = { activate, deactivate };

// DIRTY PARSE
function createStream(line) {
  let pos = 0;
  return {
    startPos: 0,
    pos: 0,
    next() {
      if (this.pos < line.length) {
        this.startPos = this.pos;
        return line[this.pos++];
      }
      return null;
    },
    current() {
      return line.substring(this.startPos, this.pos);
    },
    peek() {
      return this.pos < line.length ? line[this.pos] : null;
    },
    eat(char) {
      if (this.peek() === char) {
        this.pos++;
        return true;
      }
      return false;
    },
    eatWhile(regex) {
      let matched = false;
      while (this.pos < line.length && regex.test(line[this.pos])) {
        this.pos++;
        matched = true;
      }
      return matched;
    },
    eatSpace() {
      return this.eatWhile(/\s/);
    },
    sol() {
      return this.pos === 0;
    },
    eol() {
      return this.pos >= line.length;
    },
    skipToEnd() {
      this.pos = line.length;
    }
  };
}
