const CommandHandler = require('./CommandHandler'); 

class SearchWorkflowHandler extends CommandHandler {
    async handle(context) {
        await context.sendActivity('Faça uma pergunta:');
    }
}

module.exports = SearchWorkflowHandler;
