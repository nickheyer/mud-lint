const vscode = require('vscode');

// LOAD COMPLETION ITEMS FROM STDLIB
const completionsData = require('./stdlib.json');

// CREATE COMPLETION PROVIDER
class MudCompletionProvider {
    provideCompletionItems(document, position) {
        const completionItems = [];
        
        for (const completion of completionsData.completions) {
            const item = new vscode.CompletionItem(completion.label);
            item.kind = this.getCompletionKind(completion.type);
            item.detail = completion.section;
            item.documentation = completion.info;
            completionItems.push(item);
        }
        
        return completionItems;
    }
    
    getCompletionKind(type) {
        switch (type) {
            case 'function': return vscode.CompletionItemKind.Function;
            case 'keyword': return vscode.CompletionItemKind.Keyword;
            default: return vscode.CompletionItemKind.Text;
        }
    }
}

// ACTIVATE EXTENSION
function activate(context) {
    // REGISTER COMPLETION PROVIDER
    const provider = vscode.languages.registerCompletionItemProvider(
        'mud',
        new MudCompletionProvider()
    );
    
    // REGISTER BASIC LANGUAGE FEATURES
    const diagnostics = vscode.languages.createDiagnosticCollection('mud');
    
    // WATCH FOR DOCUMENT CHANGES
    context.subscriptions.push(
        vscode.workspace.onDidChangeTextDocument(event => {
            if (event.document.languageId === 'mud') {
                validateDocument(event.document, diagnostics);
            }
        })
    );
    
    context.subscriptions.push(provider);
    context.subscriptions.push(diagnostics);
}

// BASIC VALIDATION
function validateDocument(document, diagnostics) {
    const text = document.getText();
    const problems = [];
    
    // ADD BASIC VALIDATION RULES HERE
    // FOR EXAMPLE: CHECK FOR UNMATCHED QUOTES, PARENTHESES, ETC.
    
    diagnostics.set(document.uri, problems);
}

module.exports = { activate };
