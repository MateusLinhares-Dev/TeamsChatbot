const CommandHandler = require('./CommandHandler'); 

class DocumentHandler extends CommandHandler {
    async handle(context) {
        await context.sendActivity('Faça uma pergunta:');
    }
}

module.exports = DocumentHandler;
