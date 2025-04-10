const CommandHandler = require('./CommandHandler'); 

class InstanceWorkflowHandler extends CommandHandler {
    async handle(context) {
        await context.sendActivity('Faça uma pergunta:');
    }
}

module.exports = InstanceWorkflowHandler;
